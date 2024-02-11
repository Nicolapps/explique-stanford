"use client";

import { useQuery } from "@/usingSession";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { formatTimestampHumanFormat } from "@/util/date";
import { PlusIcon } from "@heroicons/react/20/solid";

export default function Admin() {
  const weeks = useQuery(api.admin.exercises.list, {});

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <div className="flex mb-8 gap-4 flex-wrap items-center justify-between">
          <h1 className="font-semibold text-4xl tracking-tight">Weeks</h1>

          <Link
            href="/admin/weeks/new"
            className="font-medium px-4 py-2 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200"
          >
            Add Week
          </Link>
        </div>

        {weeks?.map((week) => (
          <div key={week._id}>
            <h2 className="text-3xl font-medium mt-8 mb-4 flex gap-3 flex-wrap items-baseline">
              <span>{week.name}</span>
              <Link
                href={`/admin/weeks/${week._id}`}
                className="font-medium text-blue-800 flex items-center text-base gap-1"
              >
                Edit
              </Link>
            </h2>
            <p className="text-gray-700">
              <strong className="font-medium text-gray-800">
                {formatTimestampHumanFormat(week.startDate)}
              </strong>{" "}
              to{" "}
              <strong className="font-medium text-gray-800">
                {formatTimestampHumanFormat(week.endDate)}
              </strong>{" "}
              (extra time:{" "}
              <strong className="font-medium text-gray-800">
                {formatTimestampHumanFormat(week.endDateExtraTime)}
              </strong>
              )
            </p>

            <div className="mt-4 divide-y">
              {week.exercises.map((exercise) => (
                <Link
                  key={exercise._id}
                  href={`/admin/exercises/${exercise._id}`}
                  className="text-blue-800 flex items-center py-3 px-8 hover:bg-blue-100 rounded-lg"
                >
                  {exercise.name}
                </Link>
              ))}

              <Link
                href={`/admin/exercises/new/${week._id}`}
                className="font-medium text-blue-800 flex items-center py-3 hover:bg-blue-100 rounded-lg"
              >
                <span className="w-8 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5" />
                </span>
                Add Exercise
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
