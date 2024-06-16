"use client";

import Title from "@/components/typography";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useConvex } from "convex/react";
import { useSessionId } from "@/components/SessionProvider";
import { useIdentities } from "@/hooks/useIdentities";
import { Button } from "@/components/Button";

type ScoresQueryResult = {
  weeks: {
    id: Id<"weeks">;
    name: string;
    exercises: { id: Id<"exercises">; name: string }[];
  }[];
  users: {
    id: string;

    email: string | null;
    identifier?: string;
    shownEmail: string;

    completedExercises: Id<"exercises">[];
    isAdmin?: boolean;
    earlyAccess?: boolean;
  }[];
};

export default function ScoresPage() {
  const convex = useConvex();
  const sessionId = useSessionId();
  const identites = useIdentities();

  const [data, setData] = useState<ScoresQueryResult | undefined>(undefined);
  useEffect(() => {
    if (data || !identites) return;

    (async () => {
      const data = await convex.query(api.admin.scores.default, { sessionId });
      setData({
        ...data,
        users: data.users
          .map((user) => {
            const identifier = user.identifier ?? "";
            return {
              ...user,
              shownEmail:
                identifier in identites
                  ? identites[identifier].email
                  : user.email ?? "Unknown",
            };
          })
          .sort((a, b) => a.shownEmail.localeCompare(b.shownEmail)),
      });
    })();
  }, [data, convex, sessionId, identites]);

  return (
    <>
      <Title>
        <span className="flex-1">Scores</span>
        {data && (
          <Button
            onClick={() => {
              const rows: string[][] = [
                [
                  "Student",
                  "Role",
                  ...data.weeks.flatMap((week) =>
                    week.exercises.map((e) => e.name),
                  ),
                  "Completed exercises",
                ],
                ...data.users.map((user) => [
                  user.shownEmail,
                  user.isAdmin ? "Admin" : user.earlyAccess ? "TA" : "",
                  ...data.weeks.flatMap((week) =>
                    week.exercises.map((exercise) =>
                      user.completedExercises.includes(exercise.id) ? "1" : "0",
                    ),
                  ),
                  user.completedExercises.length.toString(),
                ]),
              ];

              const text = rows.map((cols) => cols.join("\t")).join("\n");

              navigator.clipboard.writeText(text);
              toast.success("Copied to clipboard");
            }}
          >
            <ClipboardDocumentIcon className="w-5 h-5" />
            Copy
          </Button>
        )}
      </Title>
      {data ? (
        <div className="pb-8">
          <ScoresTable {...data} />
        </div>
      ) : (
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      )}
    </>
  );
}

function ScoresTable({ weeks, users }: ScoresQueryResult) {
  return (
    <table className="text-sm w-full divide-y divide-slate-300">
      <thead>
        <tr>
          <th
            scope="col"
            className="px-2 py-3 align-bottom text-left"
            colSpan={2}
          >
            Student
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
              {user.shownEmail.replace("@epfl.ch", "")}
            </td>
            <td className="pl-2">
              {user.isAdmin ? (
                <span className="inline-block bg-red-200 px-2 py-1 rounded-full mr-2 text-red-900 uppercase tracking-wider font-semibold text-xs">
                  Admin
                </span>
              ) : user.earlyAccess ? (
                <span className="inline-block bg-orange-200 px-2 py-1 rounded-full mr-2 text-orange-900 uppercase tracking-wider font-semibold text-xs">
                  TA
                </span>
              ) : null}
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
  );
}
