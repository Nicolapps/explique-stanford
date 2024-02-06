import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Markdown from "react-markdown";

export default function QuizExercise({
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

      <QuizContents
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
        <Markdown className={"prose text-2xl mb-2"}>{question}</Markdown>
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
