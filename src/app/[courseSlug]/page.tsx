"use client";

import { api } from "../../../convex/_generated/api";
import {
  CheckIcon,
  ChevronUpDownIcon,
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
import { useIdentity } from "@/components/SessionProvider";
import { useCourseSlug } from "@/hooks/useCourseSlug";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ExerciseLink } from "@/components/ExerciseLink";
import { TabBar } from "@/components/TabBar";

function Login() {
  const router = useRouter();
  const courseSlug = useCourseSlug();
  const user = useQuery(api.courses.getRegistration, { courseSlug });
  const identity = useIdentity();

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [router, user]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col leading-snug text-gray-700">
        <p className="text-gray-800 font-semibold">
          {identity ? identity.name : user.name}
          {user.group && <span className="font-normal"> ({user.group})</span>}
        </p>
        <p>{identity ? identity.email : user.email}</p>
      </div>
    </div>
  );
}

function CourseSelector() {
  const router = useRouter();

  const courseSlug = useCourseSlug();
  const user = useQuery(api.courses.getRegistration, { courseSlug });
  const courses = useQuery(api.courses.getMyRegistrations, {});

  if (!user || !courses) {
    return (
      <div className="w-full mx-auto h-24 sm:h-32 rounded-xl bg-slate-200 animate-pulse"></div>
    );
  }

  return (
    <>
      <Listbox
        value={courseSlug}
        onChange={(selectedCourseSlug) => {
          router.push(`/${selectedCourseSlug}`);
        }}
      >
        {({ open }) => (
          <>
            <div className="relative">
              <ListboxButton
                className={clsx(
                  "w-full cursor-default rounded-2xl py-1.5 px-10 text-left text-gray-900 ring-inset focus:outline-none focus:ring-4 sm:text-sm sm:leading-6 h-24 sm:h-32",
                  open && "ring-4",
                )}
              >
                <h1 className="flex flex-col justify-center text-center items-center">
                  <span className="block sm:text-xl font-bold tracking-wider text-gray-500 sm:mb-1">
                    {user.course.code}
                  </span>
                  <span className="block text-balance text-3xl sm:text-4xl font-semibold tracking-tight text-gray-800">
                    {user.course.name}
                  </span>
                </h1>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </ListboxButton>

              <Transition
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {courses.map((course) => (
                    <ListboxOption
                      key={course.slug}
                      className={({ focus }) =>
                        clsx(
                          focus ? "bg-purple-600 text-white" : "",
                          !focus ? "text-gray-900" : "",
                          "relative cursor-default select-none py-2 pl-9 pr-4",
                        )
                      }
                      value={course.slug}
                    >
                      {({ selected, focus }) => (
                        <>
                          <div className="flex gap-2">
                            <span
                              className={clsx(
                                focus ? "text-purple-200" : "text-gray-500",
                                "ml-2 truncate tabular-nums",
                              )}
                            >
                              {course.code}
                            </span>
                            <span
                              className={clsx(
                                selected ? "font-semibold" : "font-normal",
                                "truncate",
                              )}
                            >
                              {course.name}
                            </span>
                          </div>

                          {selected ? (
                            <span
                              className={clsx(
                                focus ? "text-white" : "text-indigo-600",
                                "absolute inset-y-0 left-0 flex items-center pl-4",
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </ListboxOption>
                  ))}

                  <hr />
                  <p className="py-2 px-5 text-gray-500">
                    If there is a course missing, please contact your
                    instructor.
                  </p>
                </ListboxOptions>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </>
  );
}

export default function CoursePage() {
  const courseSlug = useCourseSlug();
  const user = useQuery(api.courses.getRegistration, { courseSlug });

  return (
    <>
      <div className="bg-gradient-to-b from-purple-200 via-indigo-200 to-blue-200">
        <div className="p-6 sm:p-10 pb-0 sm:pb-0 flex justify-center">
          <div className="max-w-6xl flex-1">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex-1 text-3xl tracking-tight font-medium select-none cursor-default my-2">
                explique.ai
              </div>
              <Login />
            </div>

            <div className="bg-white shadow-[0_-20px_40px_-12px_rgb(0_0_0_/_0.1)] rounded-t-2xl p-8 md:p-14 w-full max-w-2xl mx-auto mt-8">
              <CourseSelector />
            </div>
          </div>
        </div>
      </div>
      <div className="relative p-6 sm:p-10 flex justify-center shadow-[0_-10px_10px_-3px_rgba(0_0_0_/_0.08)]">
        <div className="max-w-6xl flex-1">
          {user?.isAdmin && (
            <TabBar
              items={[
                { label: "Exercises", href: `/${courseSlug}` },
                { label: "Admin", href: `/${courseSlug}/admin` },
              ]}
            />
          )}

          {user ? <ProjectGrid /> : <ProjectGridSkeleton />}
          <div className="h-10" />
        </div>
      </div>
    </>
  );
}

function ProjectGrid() {
  const courseSlug = useCourseSlug();
  const weeks = useQuery(api.exercises.list, { courseSlug });

  if (!weeks) {
    return <ProjectGridSkeleton />;
  }

  return (
    <div className="grid gap-12">
      {weeks.map((week) => {
        const isCompleted = week.exercises.every(
          (exercise) => exercise.completed,
        );

        return (
          <div key={week.id}>
            <header className="flex gap-4 flex-wrap items-center justify-between">
              <h2 className="font-medium text-3xl tracking-tight">
                {week.name}
              </h2>

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
                <ExerciseLink
                  key={exercise.id}
                  href={`/e/${exercise.id}`}
                  name={exercise.name}
                  image={exercise.image}
                  corner={
                    <div
                      className={clsx(
                        "w-24 h-24 tr-corner flex text-white rounded-tr-3xl",
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
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="animate-pulse" key={i}>
          <div className="flex flex-wrap h-9">
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
      ))}
    </div>
  );
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
