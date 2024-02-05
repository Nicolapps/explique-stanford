"use client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Markdown from "react-markdown";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "@/usingSession";

export default function Page({ params }: { params: { id: string } }) {
  const attemptId = params.id as Id<"attempts">;

  const metadata = useQuery(api.attempts.get, { id: attemptId });
  const chat = useQuery(api.chat.getMessages, { attemptId });

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [chat]);

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
            {metadata.exercise.name}
          </h1>

          <Link
            href={`/a/new?exerciseId=${metadata.exercise._id}`}
            title="Back"
            className="absolute top-0 right-0 w-16 h-16 flex items-center justify-center"
          >
            <ArrowPathIcon className="w-6 h-6" />
          </Link>
        </header>

        <div className="h-14"></div>

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
                    <Markdown
                      className={clsx(
                        "prose",
                        !message.system && "prose-invert",
                      )}
                    >
                      {message.content}
                    </Markdown>
                  ) : (
                    <p className="prose text-white">{message.content}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!metadata.attempt.completed && (
          <>
            <div className="h-20"></div>
            <NewMessage attemptId={attemptId} />
          </>
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
