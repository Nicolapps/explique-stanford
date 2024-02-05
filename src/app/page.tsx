"use client";

import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Welcome } from "@/components/Welcome";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Doc } from "../../convex/_generated/dataModel";
import clsx from "clsx";
import { useQuery } from "@/usingSession";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetSessionId } from "@/components/SessionProvider";
import { timeFromNow } from "@/util/date";

function ExerciseLink({
  exercise,
}: {
  exercise: Doc<"exercises"> & { attemptId: string | null; completed: boolean };
}) {
  return (
    <Link
      key={exercise._id}
      href={`/a/${exercise.attemptId ?? `new?exerciseId=${exercise._id}`}`}
      className="block bg-white overflow-hidden rounded-3xl shadow-lg transition hover:scale-105 hover:shadow-2xl"
    >
      <div className="relative bg-slate-500 pb-[100%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 object-cover"
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

  const setSessionId = useSetSessionId();

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
      <button
        className="font-medium px-4 py-2 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200"
        onClick={() => setSessionId(null)}
      >
        Logout
      </button>
    </div>
  );
}

export default function Home() {
  const user = useQuery(api.auth.get, {});

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <Welcome />

      <div className="max-w-6xl flex-1">
        <Login />

        <h1 className="font-semibold text-4xl tracking-tight my-8">
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

  return (
    weeks?.map((week) => (
      <div key={week.id}>
        <h2 className="font-light text-3xl tracking-tight mb-1">
          {week.name}
        </h2>
        <p className="text-gray-700">
          Due on{' '}
          <strong className="font-medium text-gray-800">{new Date(week.endDate).toLocaleDateString()} {new Date(week.endDate).toLocaleTimeString()}</strong>
          {Date.now() < week.endDate && (
            <span> ({timeFromNow(new Date(week.endDate))})</span>
          )}
        </p>

        {/* @TODO Completion badge */}

        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
          {week.exercises.map((exercise) => (
            <ExerciseLink exercise={exercise} key={exercise._id} />
          ))}
        </div>
      </div>
    ))
  );
}
