"use client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useQuery } from "@/usingSession";
import ExplainExercise from "@/components/exercises/ExplainExercise";
import QuizExercise from "@/components/exercises/QuizExercise";
import ReadingExercise from "@/components/exercises/ReadingExercise";

export default function Page({ params }: { params: { id: string } }) {
  const attemptId = params.id as Id<"attempts">;

  const metadata = useQuery(api.attempts.get, { id: attemptId });

  if (!metadata) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <header className="fixed h-16 top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-lg p-4 shadow-lg flex items-center justify-center">
          <Link
            href="/"
            title="Back"
            className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>

          <h1 className="text-xl font-medium text-center">
            {metadata.exerciseName}
          </h1>

          {metadata.status === "exercise" && metadata.text === null && (
            <Link
              href={`/a/new?exerciseId=${metadata.exerciseId}`}
              title="Back"
              className="absolute top-0 right-0 w-16 h-16 flex items-center justify-center"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </Link>
          )}
        </header>

        <div className="h-14"></div>

        {metadata.quiz ? (
          <QuizExercise
            attemptId={attemptId}
            title={metadata.exerciseName}
            question={metadata.quiz.question}
            answers={metadata.quiz.answers}
            lastSubmission={metadata.lastQuizSubmission}
            succeeded={metadata.status === "quizCompleted"}
          />
        ) : metadata.text ? (
          <ReadingExercise title={metadata.exerciseName} text={metadata.text} />
        ) : (
          <ExplainExercise
            title={metadata.exerciseName}
            isCompleted={metadata.status === "exerciseCompleted"}
            attemptId={attemptId}
          />
        )}
      </div>
    </div>
  );
}
