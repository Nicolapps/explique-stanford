"use client";

import { useQuery } from "@/usingSession";
import Link from "next/link";
import { formatTimestampHumanFormat } from "@/util/date";
import { PlusIcon } from "@heroicons/react/20/solid";
import { api } from "../../../../../convex/_generated/api";
import { useCourseSlug } from "@/hooks/useCourseSlug";
import Title from "@/components/typography";
import { ExerciseLink } from "../../page";

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
            </strong>
          </p>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {week.exercises.map((exercise) => (
              <ExerciseLink
                href={`/${courseSlug}/admin/exercises/${exercise.id}`}
                name={exercise.name}
                image={exercise.image}
                key={exercise.id}
              />
            ))}

            <Link
              href={`/${courseSlug}/admin/exercises/new/${week._id}`}
              className="block rounded-3xl shadow-[inset_0_0_0_2px_#bfdbfe] transition-shadow hover:shadow-[inset_0_0_0_2px_#3b82f6]"
            >
              <div className="relative pb-[57.14%]">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-900 text-xl font-light gap-2">
                  <PlusIcon className="w-6 h-6" />
                  <span>New Exercise</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      ))}
    </>
  );
}
