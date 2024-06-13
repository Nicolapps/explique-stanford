"use client";

import { useQuery } from "@/usingSession";
import Link from "next/link";
import { formatTimestampHumanFormat } from "@/util/date";
import { PlusIcon } from "@heroicons/react/20/solid";
import { api } from "../../../../../convex/_generated/api";
import { useCourseSlug } from "@/hooks/useCourseSlug";
import Title from "@/components/typography";

export default function Admin() {
  const courseSlug = useCourseSlug();
  const weeks = useQuery(api.admin.exercises.list, {
    courseSlug,
  });

  return (
    <>
      <Title>
        <span className="flex-1">Weeks</span>

        <Link
          href={`/${courseSlug}/admin/weeks/new`}
          className="font-medium px-4 py-2 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200 text-base flex items-center gap-2 tracking-normal"
        >
          Add Week
        </Link>
      </Title>

      {weeks?.map((week) => (
        <div key={week._id}>
          <h2 className="text-3xl font-medium mt-8 mb-4 flex gap-3 flex-wrap items-baseline">
            <span>{week.name}</span>
            <Link
              href={`/${courseSlug}/admin/weeks/${week._id}`}
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
                href={`/${courseSlug}/admin/exercises/${exercise._id}`}
                className="text-blue-800 flex items-center py-3 px-8 hover:bg-blue-100 rounded-lg"
              >
                {exercise.name}
              </Link>
            ))}

            <Link
              href={`/${courseSlug}/admin/exercises/new/${week._id}`}
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
    </>
  );
}
