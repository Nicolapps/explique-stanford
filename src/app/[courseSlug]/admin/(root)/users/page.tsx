"use client";

import Title from "@/components/typography";
import { api } from "../../../../../../convex/_generated/api";
import React, { useState } from "react";
import clsx from "clsx";
import {
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
} from "@heroicons/react/16/solid";
import { toast } from "sonner";
import { useConvex, usePaginatedQuery } from "convex/react";
import { useSessionId } from "@/components/SessionProvider";
import {
  Identities,
  useIdentities,
  useIsUsingIdentities,
} from "@/hooks/useIdentities";
import { useCourseSlug } from "@/hooks/useCourseSlug";
import { Textarea } from "@/components/Input";
import { useMutation, useQuery } from "@/usingSession";
import { Button } from "@/components/Button";
import { LockClosedIcon, TableCellsIcon } from "@heroicons/react/20/solid";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Modal } from "@/components/Modal";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

export default function ScoresPage() {
  return (
    <>
      <Title>
        <span className="flex-1">Users</span>
        <DownloadAllButton />
      </Title>
      <ScoresTable />
      <AddUsers />
    </>
  );
}

function shownEmail(
  identities: Identities,
  user: { identifier?: string; email: string | null },
) {
  return user.identifier !== undefined && user.identifier in identities
    ? identities[user.identifier].email
    : user.email ?? "Unknown";
}

function DownloadAllButton() {
  const convex = useConvex();
  const sessionId = useSessionId();
  const identites = useIdentities();
  const courseSlug = useCourseSlug();
  const weeks = useQuery(api.admin.users.listExercisesForTable, { courseSlug });

  const [spreadsheet, setSpreadsheet] = useState<string | null>(null);

  async function copyAllResults() {
    if (identites === undefined || weeks === undefined) return;

    async function getAllRegistrations() {
      let continueCursor = null;
      let isDone = false;
      let page;

      const results = [];

      while (!isDone) {
        ({ continueCursor, isDone, page } = await convex.query(
          api.admin.users.list,
          {
            courseSlug,
            sessionId,
            paginationOpts: { numItems: 50, cursor: continueCursor },
          },
        ));
        console.log("got", page.length);
        results.push(...page);
      }

      return results;
    }

    const users = await getAllRegistrations();

    const rows: string[][] = [
      [
        "User",
        "Role",
        ...weeks.flatMap((week) => week.exercises.map((e) => e.name)),
        "Completed exercises",
      ],
      ...users.map((user) => [
        shownEmail(identites, user),
        user.role === "admin" ? "Admin" : user.role === "ta" ? "TA" : "",
        ...weeks.flatMap((week) =>
          week.exercises.map((exercise) =>
            user.completedExercises.includes(exercise.id) ? "1" : "0",
          ),
        ),
        user.completedExercises.length.toString(),
      ]),
    ];

    setSpreadsheet(rows.map((cols) => cols.join("\t")).join("\n"));
  }

  if (!identites || weeks === undefined) return null;

  return (
    <>
      <Button
        onClick={() => {
          toast.promise(copyAllResults(), {
            loading: "Downloading the table…",
          });
        }}
      >
        <TableCellsIcon className="w-5 h-5" />
        To Spreadsheet
      </Button>

      <Modal
        title="Results"
        isOpen={spreadsheet !== null}
        onClose={() => setSpreadsheet(null)}
      >
        <div className="font-mono my-4">
          <Textarea
            value={spreadsheet ?? ""}
            readOnly
            label=""
            onChange={() => {}}
          />
        </div>

        <div className="flex justify-center">
          <PrimaryButton
            onClick={() => {
              navigator.clipboard.writeText(spreadsheet ?? "");
              toast.success(
                "Copied to clipboard. You can paste it in spreadsheet software.",
              );
            }}
          >
            <ClipboardDocumentIcon className="w-5 h-5" />
            Copy to Clipboard
          </PrimaryButton>
        </div>
      </Modal>
    </>
  );
}

function ScoresTable() {
  const identities = useIdentities();
  const courseSlug = useCourseSlug();
  const sessionId = useSessionId();

  const weeks = useQuery(api.admin.users.listExercisesForTable, { courseSlug });
  const {
    results: users,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.admin.users.list,
    { courseSlug, sessionId },
    { initialNumItems: 20 },
  );

  if (!identities || weeks === undefined || users === undefined) {
    return <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />;
  }

  return (
    <>
      <table className="text-sm w-full divide-y divide-slate-300 pb-8">
        <thead>
          <tr>
            <th
              scope="col"
              className="px-2 py-3 align-bottom text-left"
              colSpan={2}
            >
              User
            </th>
            {weeks.map((week) => (
              <React.Fragment key={week.id}>
                {week.exercises.map((exercise) => (
                  <th
                    scope="col"
                    className={clsx("align-bottom px-2 py-3 h-24 relative")}
                    key={exercise.id}
                  >
                    <div className="text-left w-full h-40 [writing-mode:vertical-rl] flex items-center rotate-180 leading-tight font-medium">
                      {exercise.name}
                    </div>
                  </th>
                ))}
              </React.Fragment>
            ))}
            <th scope="col" className="px-2 py-3 align-bottom text-right">
              #
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-2 py-3">
                {shownEmail(identities, user).replace("@epfl.ch", "")}
              </td>
              <td className="pl-2">
                {user.role === "admin" ? (
                  <span className="inline-block bg-red-200 px-2 py-1 rounded-full mr-2 text-red-900 uppercase tracking-wider font-semibold text-xs">
                    Admin
                  </span>
                ) : user.role === "ta" ? (
                  <span className="inline-block bg-orange-200 px-2 py-1 rounded-full mr-2 text-orange-900 uppercase tracking-wider font-semibold text-xs">
                    TA
                  </span>
                ) : (
                  <MinusIcon className="w-4 h-4 text-slate-400" />
                )}
              </td>
              {weeks.map((week) => (
                <React.Fragment key={week.id}>
                  {week.exercises.map((exercise, exerciseIndex) => (
                    <td
                      className={clsx(
                        "px-2 py-3 text-center",
                        exerciseIndex === 0 ? "border-l border-slate-300" : "",
                        exerciseIndex === week.exercises.length - 1
                          ? "border-r border-slate-300"
                          : "",
                      )}
                      key={exercise.id}
                    >
                      {user.completedExercises.includes(exercise.id) ? (
                        <CheckIcon className="w-4 h-4 inline-flex" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  ))}
                </React.Fragment>
              ))}
              <td className="px-2 py-3 items-center text-right tabular-nums font-semibold">
                {user.completedExercises.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => loadMore(200)}
          >
            <div className="flex items-center gap-1">
              <ChevronDownIcon className="w-4 h-4" aria-hidden /> Show More
            </div>
          </button>
        </div>
      )}
    </>
  );
}

function AddUsers() {
  const [emails, setEmails] = useState("");
  const courseSlug = useCourseSlug();
  const convex = useConvex();
  const sessionId = useSessionId();
  const isUsingIdentities = useIsUsingIdentities();
  const addUser = useMutation(api.admin.users.register);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();

        const validatedEmails = emails
          .split("\n")
          .map((l) => l.trim())
          .filter((email) => !!email);

        if (validatedEmails.length === 0) {
          return;
        }

        const invalidEmail = validatedEmails.find(
          (e) => !e.includes("@") || e.includes(" ") || e.includes(","),
        );
        if (invalidEmail) {
          toast.error(`Invalid email address: ${invalidEmail}`);
          return;
        }

        setEmails("");

        let users;
        if (isUsingIdentities) {
          const jwt = await convex.query(api.admin.identitiesJwt.default, {
            sessionId,
            courseSlug,
          });

          const resConvert = await fetch(
            "/api/admin/computeIdentifiers?for=" + validatedEmails.join(","),
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            },
          );
          if (resConvert.status !== 200) {
            toast.error("Failed to retrieve the email addresses.");
            return;
          }
          const identifiers = (await resConvert.json()) as string[];
          users = { identifiers };
        } else {
          users = { emails: validatedEmails };
        }

        const { added, ignored } = await addUser({
          courseSlug,
          users,
        });
        toast.success(
          (added === 1
            ? `1 user has been added.`
            : `${added} users have been added.`) +
            (ignored === 0
              ? ""
              : ignored === 1
                ? " 1 user was already registered."
                : ` ${ignored} users were already registered.`),
        );
      }}
    >
      <h2 className="font-medium text-2xl tracking-wide mb-6 mt-12">
        Add Users
      </h2>

      <Textarea
        value={emails}
        label={
          <>
            Email addresses{" "}
            <small className="font-normal color-gray-600">
              (one address by line)
            </small>
          </>
        }
        onChange={setEmails}
        hint={
          <>
            {isUsingIdentities && (
              <span className="flex gap-1 items-center">
                <LockClosedIcon className="w-4 h-4" aria-hidden />
                The personal data of the users never leave the EPFL servers.
              </span>
            )}
          </>
        }
        required
      />

      <div className="pb-8">
        <PrimaryButton type="submit" disabled={!emails.trim()}>
          Add Users
        </PrimaryButton>
      </div>
    </form>
  );
}
