"use client";

import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { ResearchConsent } from "@/components/ResearchConsent";
import {
  CheckIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  CheckIcon as CheckIconSmall,
  XMarkIcon as XMarkIconSmall,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useQuery } from "@/usingSession";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatTimestampHumanFormat, timeFromNow } from "@/util/date";
import Tooltip from "@/components/Tooltip";
import Title from "@/components/typography";
function ExerciseLink({
  exercise,
}: {
  exercise: {
    id: string;
    name: string;
    image: {
      thumbnails: { type: string; sizes?: string; src: string }[];
    } | null;
    completed: boolean;
  };
}) {
  return (
    <Link
      href={`/e/${exercise.id}`}
      className="block bg-white overflow-hidden rounded-3xl shadow-lg transition hover:scale-105 hover:shadow-2xl group"
    >
      <div
        className={clsx(
          "relative pb-[57.14%]",
          exercise.image && "bg-slate-500",
          !exercise.image && "bg-slate-600",
        )}
      >
        {exercise.image && (
          <picture>
            {exercise.image.thumbnails.map((t, tIndex) => (
              <source
                key={tIndex}
                srcSet={t.src}
                type={t.type}
                sizes={t.sizes}
              />
            ))}
            <img
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform object-center"
              src={
                exercise.image.thumbnails.find((t) => t.type === "image/avif")
                  ?.src ?? undefined
              }
              alt={""}
            />
          </picture>
        )}

        <div
          className={clsx(
            "absolute inset-0 flex p-4 text-white items-end",
            exercise.image && "bg-gradient-to-t via-black/25 from-black/70",
          )}
        >
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
        <p className="text-gray-800 font-semibold">
          {user.name}
          {user.group && <span className="font-normal"> ({user.group})</span>}
        </p>
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

        <Title className="mt-12 sm:mt-0">Algorithms</Title>

        {user && user.researchConsent ? (
          <ProjectGrid />
        ) : (
          <ProjectGridSkeleton />
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}

function ProjectGrid() {
  const weeks = useQuery(api.exercises.list, {});

  if (!weeks) {
    return <ProjectGridSkeleton />;
  }

  return weeks.map((week) => {
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

        {week.preview && (
          <p className="text-gray-700 my-4">
            <span className="inline-block bg-amber-200 px-2 py-1 rounded-lg mr-2 text-amber-900 uppercase tracking-wider font-semibold">
              Preview
            </span>
            Will be released on{" "}
            <strong className="font-medium text-gray-800">
              {formatTimestampHumanFormat(week.startDate)}
            </strong>
          </p>
        )}
        <div className="text-gray-700 my-4">
          <span>Due on</span>{" "}
          {week.endDateExtraTime === null ? (
            <Deadline timestamp={week.endDate} />
          ) : (
            <>
              <span className="inline-flex flex-wrap items-center gap-1">
                <s className="opacity-60">
                  <Deadline timestamp={week.endDate} />
                </s>

                <Tooltip tip="Extra time applied">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500 inline-block mr-1" />
                </Tooltip>
              </span>{" "}
              <Deadline timestamp={week.endDateExtraTime} />
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {week.exercises.map((exercise) => (
            <ExerciseLink exercise={exercise} key={exercise.id} />
          ))}
        </div>
      </div>
    );
  });
}

function ProjectGridSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div className="animate-pulse" key={i}>
      <div className="mt-12 mb-4 flex flex-wrap h-9">
        <div className="bg-slate-200 rounded flex-1 mr-[20%]" />
        <div className="bg-slate-200 rounded-full w-36" />
      </div>

      <div className="h-6 my-4 bg-slate-200 rounded w-72" />

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="pb-[57.14%] bg-slate-200 rounded-3xl" />
        ))}
      </div>
    </div>
  ));
}

function Deadline({ timestamp }: { timestamp: number }) {
  return (
    <>
      <strong className="font-medium text-gray-800">
        {formatTimestampHumanFormat(timestamp)}
      </strong>
      {Date.now() < timestamp && (
        <span> ({timeFromNow(new Date(timestamp))})</span>
      )}
    </>
  );
}
