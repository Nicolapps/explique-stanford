"use client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useQuery } from "@/usingSession";
import ExplainExercise from "@/components/exercises/ExplainExercise";
import QuizExercise from "@/components/exercises/QuizExercise";
import ReadingExercise from "@/components/exercises/ReadingExercise";
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Tooltip from "@/components/Tooltip";

export default function Page({ params }: { params: { id: string } }) {
  const attemptId = params.id as Id<"attempts">;

  const metadata = useQuery(api.attempts.get, { id: attemptId });

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <header className="fixed h-14 sm:h-16 top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-lg p-4 shadow-lg flex items-center justify-center z-10">
          {metadata && (
            <Link
              href={`/${metadata.courseSlug}`}
              title="Back"
              className="absolute top-0 left-0 sm:w-16 sm:h-16 w-14 h-14 flex items-center justify-center"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
          )}

          <h1 className="text-lg sm:text-xl font-medium text-center">
            {metadata?.exerciseName ?? (
              <div className="animate-pulse h-7 bg-slate-200 rounded w-56" />
            )}
          </h1>

          {metadata &&
            ((metadata.status === "exercise" && metadata.text === null) ||
              metadata.isAdmin) &&
            !metadata.isDue && (
              <RestartButton exerciseId={metadata.exerciseId} />
            )}
        </header>

        {metadata && (
          <>
            <div className="h-14"></div>

            {!metadata.isSolutionShown &&
              (metadata.quiz ? (
                <QuizExercise
                  attemptId={attemptId}
                  title={metadata.exerciseName}
                  questions={metadata.quiz}
                  lastSubmission={metadata.lastQuizSubmission}
                  succeeded={metadata.status === "quizCompleted"}
                  isDue={metadata.isDue}
                />
              ) : metadata.text ? (
                <ReadingExercise
                  hasQuiz={metadata.hasQuiz}
                  text={metadata.text}
                  attemptId={attemptId}
                  nextButton={metadata.isDue ? "disable" : "show"}
                />
              ) : (
                <ExplainExercise
                  hasQuiz={metadata.hasQuiz}
                  writeDisabled={
                    metadata.status !== "exercise" || metadata.isDue
                  }
                  attemptId={attemptId}
                  nextButton={metadata.isDue ? "disable" : "show"}
                />
              ))}

            {metadata.isSolutionShown && (
              <>
                {metadata.text ? (
                  <ReadingExercise
                    hasQuiz={metadata.hasQuiz}
                    text={metadata.text}
                    attemptId={attemptId}
                    nextButton="hide"
                  />
                ) : (
                  <ExplainExercise
                    hasQuiz={metadata.hasQuiz}
                    writeDisabled
                    attemptId={attemptId}
                    nextButton="hide"
                  />
                )}

                {metadata.hasQuiz && (
                  <>
                    <hr className="mx-8 my-12" />

                    <QuizExercise
                      attemptId={attemptId}
                      title={metadata.exerciseName}
                      questions={metadata.quiz!}
                      lastSubmission={metadata.lastQuizSubmission}
                      succeeded={metadata.status === "quizCompleted"}
                      isDue={metadata.isDue}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RestartButton({ exerciseId }: { exerciseId: Id<"exercises"> }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="absolute top-0 right-0">
        <Tooltip
          asChild
          side="bottom"
          sideOffset={-10}
          tip="Restart the conversation"
        >
          <button
            className="sm:w-16 sm:h-16 w-14 h-14 flex items-center justify-center"
            onClick={() => setIsModalOpen(true)}
          >
            <ArrowPathIcon className="w-6 h-6" />
          </button>
        </Tooltip>
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Restart the exercise?
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      If you’re experiencing issues, you can restart the
                      exercise and try again.
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <Link
                      href={`/a/new?exerciseId=${exerciseId}`}
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Restart
                    </Link>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
