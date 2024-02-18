import { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "@/usingSession";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import Markdown from "../Markdown";

export default function ExplainExercise({
  attemptId,
  writeDisabled,
  nextButton,
}: {
  attemptId: Id<"attempts">;
  writeDisabled: boolean;
  nextButton: "show" | "hide" | "disable";
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
      <div className="flex flex-col gap-6">
        {chat?.map((message) => (
          <div key={message.id}>
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

                {nextButton !== "hide" && (
                  <div className="flex flex-col gap-2 items-center">
                    <button
                      className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
                      onClick={async () => {
                        await goToQuiz({ attemptId });
                      }}
                      disabled={nextButton === "disable"}
                    >
                      Continue
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>

                    <p className="text-lg font-light flex items-center justify-center gap-1">
                      <ExclamationCircleIcon
                        className="w-6 h-6 text-red-600"
                        aria-hidden="true"
                      />
                      <span>This exercise due date has passed.</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={clsx(
                  "flex",
                  message.system && "mr-6",
                  !message.system && "ml-6",
                )}
              >
                <div
                  className={clsx(
                    "inline-block p-4 rounded-xl shadow",
                    message.system && "bg-white rounded-bl-none",
                    !message.system &&
                      "bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-br-none  ml-auto",
                  )}
                >
                  {message.system ? (
                    message.appearance === "typing" ? (
                      <div className="flex gap-1" aria-label="Loading">
                        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse animation-delay-1-3"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse animation-delay-2-3"></div>
                      </div>
                    ) : message.appearance === "error" ? (
                      <div>
                        <p className="font-light flex items-center justify-center gap-1">
                          <ExclamationCircleIcon
                            className="w-6 h-6 text-red-600"
                            aria-hidden="true"
                          />
                          <span className="flex-1">
                            <strong className="font-medium text-red-600">
                              An error occurred.
                            </strong>{" "}
                            Please try again.
                          </span>
                        </p>
                      </div>
                    ) : (
                      <Markdown text={message.content} />
                    )
                  ) : (
                    <p className="prose text-white whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!writeDisabled && <NewMessage attemptId={attemptId} />}
    </>
  );
}

function NewMessage({ attemptId }: { attemptId: Id<"attempts"> }) {
  const sendMessage = useMutation(api.chat.sendMessage);
  const [message, setMessage] = useState("");

  function autoResizeTextarea() {
    if (!textareaRef.current || !paddingRef.current) return;

    const isDocumentScrolledToBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight;

    textareaRef.current.style.height = "0";
    const newHeight = Math.min(500, textareaRef.current.scrollHeight) + "px";
    textareaRef.current.style.height = newHeight;
    paddingRef.current.style.height = newHeight;

    if (isDocumentScrolledToBottom) {
      window.scrollTo({ top: document.body.scrollHeight });
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    window.addEventListener("resize", autoResizeTextarea);
    return () => window.removeEventListener("resize", autoResizeTextarea);
  });

  const paddingRef = useRef<HTMLDivElement>(null);

  function send() {
    const messageSent = message.trim();
    if (!messageSent) return;
    sendMessage({ attemptId, message: messageSent });
    setMessage("");
  }

  return (
    <>
      <div className="box-content h-[60px] pt-4" ref={paddingRef} />
      <form
        className="fixed bottom-2 left-2 flex w-[calc(100%-1rem)] shadow-xl rounded-xl"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-transparent text-lg px-4 rounded-xl resize-none bg-white py-4 h-[60px] pr-16"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !message.includes("\n")) {
              e.preventDefault();
              send();
            }
          }}
          onInput={(e) => {
            autoResizeTextarea();
          }}
        />
        <div className="flex px-2 items-center right-0 inset-y-0 absolute">
          <button
            className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            type="submit"
            title="Send"
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </div>
      </form>
    </>
  );
}
