import {
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import Markdown from "react-markdown";
import { useMutation } from "@/usingSession";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const ATTEMPT_TIMEOUT_MS = 1000 * 60 * 5;

export default function QuizExercise({
  attemptId,
  title,
  question,
  answers,
  lastSubmission,
  succeeded,
}: {
  attemptId: Id<"attempts">;
  title: string;
  question: string;
  answers: string[];
  lastSubmission: number | null;
  succeeded: boolean;
}) {
  const submit = useMutation(api.attempts.submitQuiz);

  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null,
  );

  const [timeoutSeconds, setTimeoutSeconds] = useState<null | number>(67);
  const disabled = succeeded || timeoutSeconds !== null;

  // Update the timer
  useEffect(() => {
    if (lastSubmission === null) {
      setTimeoutSeconds(null);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - lastSubmission;
      const remaining = ATTEMPT_TIMEOUT_MS - elapsed;
      setTimeoutSeconds(remaining >= 0 ? Math.floor(remaining / 1000) : null);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastSubmission]);

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

      <QuizContents
        question={question}
        answers={answers}
        selectedAnswerIndex={selectedAnswerIndex}
        onChange={setSelectedAnswerIndex}
        disabled={disabled}
      />

      <footer className="flex flex-col items-center mt-8 gap-8">
        <button
          className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
          disabled={selectedAnswerIndex === null || disabled}
          onClick={async () => {
            if (selectedAnswerIndex === null) return;

            await submit({
              attemptId,
              answer: selectedAnswerIndex,
            });
          }}
        >
          Submit
          <ArrowRightIcon className="w-5 h-5" />
        </button>

        {!succeeded && timeoutSeconds !== null && (
          <div>
            <p className="text-lg font-light flex items-center justify-center gap-1">
              <ExclamationCircleIcon
                className="w-6 h-6 text-red-600"
                aria-hidden="true"
              />
              <span>
                <strong className="font-medium text-red-600">Oops!</strong> Your
                answer is incorrect. Please wait before trying again.
              </span>
            </p>
            <p className="text-center mt-2 text-3xl font-extralight tabular-nums text-gray-600">
              {Math.floor(timeoutSeconds / 60)
                .toString()
                .padStart(2, "0")}
              :{(timeoutSeconds % 60).toString().padStart(2, "0")}
            </p>
          </div>
        )}

        {succeeded && (
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
        )}
      </footer>
    </>
  );
}

export function QuizContents({
  question,
  answers,
  selectedAnswerIndex,
  onChange,
  disabled = false,
}: {
  question: string;
  answers: string[];
  selectedAnswerIndex: number | null;
  onChange?: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <header>
        <Markdown className={"prose text-xl mb-2"}>{question}</Markdown>
      </header>

      <div>
        {answers.map((answer, index) => (
          <div key={index}>
            <label className="flex items-center py-1">
              <input
                type="radio"
                id={`answer-${index}`}
                name="answer"
                value={index}
                checked={selectedAnswerIndex === index}
                disabled={disabled}
                className="mr-2"
                onChange={(e) => onChange?.(parseInt(e.target.value, 10))}
              />

              <Markdown className="prose">{answer}</Markdown>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
