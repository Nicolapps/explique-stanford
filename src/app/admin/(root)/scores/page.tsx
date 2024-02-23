"use client";

import Title from "@/components/typography";
import { useQuery } from "@/usingSession";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import React from "react";
import clsx from "clsx";
import { CheckIcon, XMarkIcon } from "@heroicons/react/16/solid";

export default function ScoresPage() {
  const data = useQuery(api.admin.scores.default, {});
  return (
    <>
      <Title>Scores</Title>
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

function ScoresTable({
  weeks,
  users,
}: {
  weeks: {
    id: Id<"weeks">;
    name: string;
    exercises: { id: Id<"exercises">; name: string }[];
  }[];
  users: {
    email: string;
    completedExercises: Id<"exercises">[];
    isAdmin?: boolean;
    earlyAccess?: boolean;
  }[];
}) {
  return (
    <table className="text-sm w-full divide-y divide-slate-300">
      <thead>
        <tr>
          <th
            scope="col"
            className="px-2 py-4 align-bottom text-left"
            colSpan={2}
          >
            Student
          </th>
          {weeks.map((week) => (
            <React.Fragment key={week.id}>
              {week.exercises.map((exercise) => (
                <th
                  scope="col"
                  className={clsx("align-bottom px-2 py-4 h-24 relative")}
                  key={exercise.id}
                >
                  <div className="text-left w-full h-40 [writing-mode:vertical-rl] flex items-center rotate-180 leading-tight font-medium">
                    {exercise.name}
                  </div>
                </th>
              ))}
            </React.Fragment>
          ))}
          <th scope="col" className="px-2 py-4 align-bottom text-right">
            #
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {users.map((user) => (
          <tr key={user.email}>
            <td className="px-2 py-4">{user.email.replace("@epfl.ch", "")}</td>
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
                      "px-2 py-4 text-center",
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
            <td className="px-2 py-4 items-center text-right tabular-nums font-semibold">
              {user.completedExercises.length}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
