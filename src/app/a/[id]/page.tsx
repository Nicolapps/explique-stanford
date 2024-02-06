"use client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Markdown from "react-markdown";
import Link from "next/link";
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "@/usingSession";
import Quiz from "@/components/Quiz";

function ExplainExercise({
  title,
  attemptId,
  isCompleted,
}: {
  title: string;
  attemptId: Id<"attempts">;
  isCompleted: boolean;
}) {
  const chat = useQuery(api.chat.getMessages, { attemptId });

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [chat]);

  return (
    <>
      <p className="text-lg font-light flex items-center justify-center gap-1 my-8">
        <InformationCircleIcon
          className="w-6 h-6 text-purple-700"
          aria-hidden="true"
        />
        <span className="flex-1">
          <strong className="font-medium text-purple-700">Explain</strong>{" "}
          {title}.
        </span>
      </p>

      <div className="flex flex-col gap-6">
        {chat?.map((message) => (
          <div key={message._id}>
            {message.appearance === "finished" ? (
              <p className="text-lg font-light flex items-center justify-center gap-1">
                <CheckCircleIcon
                  className="w-6 h-6 text-purple-700"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium text-purple-700">
                    Congratulations!
                  </strong>{" "}
                  You have finished this exercise.
                </span>
              </p>
            ) : (
              <div
                className={clsx(
                  "p-4 rounded-xl shadow",
                  message.system && "bg-white mr-6 rounded-bl-none",
                  !message.system &&
                    "bg-gradient-to-b from-purple-500 to-purple-600 ml-6 text-white rounded-br-none",
                )}
              >
                {message.system ? (
                  <Markdown className={"prose"}>{message.content}</Markdown>
                ) : (
                  <p className="prose text-white">{message.content}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isCompleted && (
        <>
          <div className="h-20"></div>
          <NewMessage attemptId={attemptId} />
        </>
      )}
    </>
  );
}

function ReadingExercise({ title, text }: { title: string; text: string }) {
  return (
    <>
      <p className="text-lg font-light flex items-center justify-center gap-1 my-8">
        <InformationCircleIcon
          className="w-6 h-6 text-purple-700"
          aria-hidden="true"
        />
        <span className="flex-1">
          <strong className="font-medium text-purple-700">
            Read the following text
          </strong>{" "}
          about {title}.
        </span>
      </p>

      <Markdown className="prose">{text}</Markdown>

      <footer className="flex justify-center mt-8">
        <button className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700">
          I’m ready
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </footer>
    </>
  );
}

function QuizExercise({
  title,
  question,
  answers,
}: {
  title: string;
  question: string;
  answers: string[];
}) {
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null,
  );

  return (
    <>
      <p className="text-lg font-light flex items-center justify-center gap-1 my-8">
        <InformationCircleIcon
          className="w-6 h-6 text-purple-700"
          aria-hidden="true"
        />
        <span className="flex-1">
          <strong className="font-medium text-purple-700">
            Answer the following question
          </strong>{" "}
          about {title}.
        </span>
      </p>

      <Quiz
        question={question}
        answers={answers}
        selectedAnswerIndex={selectedAnswerIndex}
        onChange={setSelectedAnswerIndex}
      />

      <footer className="flex justify-center mt-8">
        <button
          className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
          disabled={selectedAnswerIndex === null}
        >
          Submit
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </footer>
    </>
  );
}

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
            title={metadata.exerciseName}
            question={metadata.quiz.question}
            answers={metadata.quiz.answers}
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

function NewMessage({ attemptId }: { attemptId: Id<"attempts"> }) {
  const sendMessage = useMutation(api.chat.sendMessage);
  const [message, setMessage] = useState("");

  return (
    <form
      className="fixed bottom-2 left-2 h-14 flex w-[calc(100%-1rem)] shadow-xl rounded-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const messageSent = message.trim();
        if (!messageSent) return;
        sendMessage({ attemptId, message: messageSent });
        setMessage("");
      }}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full bg-transparent text-lg pl-5 pr-16 rounded-xl bg-white"
      />
      <button
        className="bg-purple-600 text-white absolute right-2 top-[50%] translate-y-[-50%] w-12 h-12 rounded-full flex items-center justify-center shadow-md"
        type="submit"
        title="Send"
      >
        <PaperAirplaneIcon className="w-6 h-6" />
      </button>
    </form>
  );
}
