import { useEffect, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "@/usingSession";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import Markdown from "../Markdown";

export default function ExplainExercise({
  title,
  attemptId,
  isCompleted,
}: {
  title: string;
  attemptId: Id<"attempts">;
  isCompleted: boolean;
}) {
  const chat = useQuery(api.chat.getMessages, { attemptId });
  const goToQuiz = useMutation(api.attempts.goToQuiz);

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
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-light flex items-center justify-center gap-1">
                  <CheckCircleIcon
                    className="w-6 h-6 text-purple-700"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-medium text-purple-700">
                      Great!
                    </strong>{" "}
                    Now, let’s go on to a quiz question.
                  </span>
                </p>

                <button
                  className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
                  onClick={async () => {
                    await goToQuiz({ attemptId });
                  }}
                >
                  Continue
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
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
                  <Markdown text={message.content} />
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
