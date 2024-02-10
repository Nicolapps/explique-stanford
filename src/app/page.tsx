"use client";

import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { ResearchConsent } from "@/components/ResearchConsent";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  CheckIcon as CheckIconSmall,
  XMarkIcon as XMarkIconSmall,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useQuery } from "@/usingSession";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatTimestampHumanFormat, timeFromNow } from "@/util/date";

function ExerciseLink({
  exercise,
}: {
  exercise: {
    id: string;
    name: string;
    attemptId: string | null;
    completed: boolean;
  };
}) {
  return (
    <Link
      href={`/a/${exercise.attemptId ?? `new?exerciseId=${exercise.id}`}`}
      className="block bg-white overflow-hidden rounded-3xl shadow-lg transition hover:scale-105 hover:shadow-2xl group"
    >
      <div className="relative bg-slate-500 pb-[60%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 object-cover group-hover:scale-105 transition-transform"
          src={`/levels/${exercise.name.replace(/ /g, "")}.png`}
          alt=""
        />

        <div className="absolute inset-0 bg-gradient-to-t via-black/25 from-black/90 flex p-4 text-white items-end">
          <h2 className="font-semibold text-2xl text-shadow-lg">
            {exercise.name}
          </h2>
        </div>

        <div
          className={clsx(
            "absolute top-0 right-0 w-24 h-24 tr-corner flex text-white",
            exercise.completed &&
              "bg-gradient-to-b from-green-500 to-green-600",
            !exercise.completed && "bg-gray-500",
          )}
        >
          {exercise.completed && (
            <CheckIcon className="absolute top-4 right-4 w-6 h-6" />
          )}
          {!exercise.completed && (
            <XMarkIcon className="absolute top-4 right-4 w-6 h-6" />
          )}
        </div>
      </div>
    </Link>
  );
}

function Login() {
  const router = useRouter();
  const user = useQuery(api.auth.get, {});
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [router, user]);

  if (!user) return null;

  return (
    <div className="p-4 absolute right-0 top-0 flex items-center gap-2">
      <div className="flex flex-col leading-snug text-gray-700 px-2">
        <p className="text-gray-800 font-semibold">{user.name}</p>
        <p>{user.email}</p>
      </div>
      {user.isAdmin && (
        <Link
          href="/admin"
          className="font-medium px-4 py-2 rounded-lg bg-red-100 cursor-pointer hover:bg-red-200"
        >
          Admin
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const user = useQuery(api.auth.get, {});

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      {user && <ResearchConsent />}

      <div className="max-w-6xl flex-1">
        <Login />

        <h1 className="font-semibold text-4xl tracking-tight mt-4 mb-10">
          Algorithms
        </h1>

        {user && <ProjectGrid />}

        <div className="h-10" />
      </div>
    </div>
  );
}

function ProjectGrid() {
  const weeks = useQuery(api.exercises.list, {});

  return weeks?.map((week) => {
    const isCompleted = week.exercises.every((exercise) => exercise.completed);

    return (
      <div key={week.id}>
        <header className="flex gap-4 flex-wrap mt-12 mb-4 items-center justify-between">
          <h2 className="font-medium text-3xl tracking-tight">{week.name}</h2>

          {isCompleted ? (
            <p className="bg-gradient-to-b from-green-500 to-green-600 py-2 px-3 text-xs rounded-full font-semibold text-white tracking-wide inline-flex items-center gap-1">
              <CheckIconSmall className="w-5 h-5" />
              Completed
            </p>
          ) : (
            <p className="bg-gray-500 py-2 px-3 text-xs rounded-full font-semibold text-white tracking-wide inline-flex items-center gap-1">
              <XMarkIconSmall className="w-5 h-5" />
              Not Completed
            </p>
          )}
        </header>

        <p className="text-gray-700 my-4">
          Due on{" "}
          <strong className="font-medium text-gray-800">
            {formatTimestampHumanFormat(week.endDate)}
          </strong>
          {Date.now() < week.endDate && (
            <span> ({timeFromNow(new Date(week.endDate))})</span>
          )}
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {week.exercises.map((exercise) => (
            <ExerciseLink exercise={exercise} key={exercise.id} />
          ))}
        </div>
      </div>
    );
  });
}
