import React, { useId, useState } from "react";
import Input, { Select, Textarea } from "@/components/Input";
import { PlusIcon } from "@heroicons/react/16/solid";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { QuizContents } from "@/components/exercises/QuizExercise";
import Markdown from "@/components/Markdown";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useAction, useQuery } from "@/usingSession";

type Question = {
  question: string;
  answers: string[];
  correctAnswerIndex: number | null;
};

export type State = {
  weekId: Id<"weeks">;
  name: string;
  instructions: string;
  model: string;
  text: string;
  image?: string;
  imagePrompt?: string;

  quizQuestions: Question[];
  quizShownQuestionsCount: number;

  firstMessage: string;
  controlGroup: "A" | "B";
  completionFunctionDescription: string;
};

function MarkdownTip() {
  return (
    <>
      <a
        className="underline font-semibold"
        href="https://www.markdownguide.org/basic-syntax/"
        target="_blank"
      >
        Markdown
      </a>{" "}
      syntax is supported.
      <br />
      LaTeX is syntax is supported (e.g.{" "}
      <code className="font-mono text-gray-700">$\sqrt m$</code>).
    </>
  );
}

export default function ExerciseForm({
  initialState,
  onSubmit,
  submitLabel,
}: {
  initialState: State;
  onSubmit: (state: State) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initialState.name);
  const [weekId, setWeekId] = useState(initialState.weekId);

  const [instructions, setInstructions] = useState(initialState.instructions);
  const [model, setModel] = useState(initialState.model);
  const [text, setText] = useState(initialState.text);
  const [image, setImage] = useState(initialState.image);
  const [imagePrompt, setImagePrompt] = useState(initialState.imagePrompt);
  const [imageLoading, setImageLoading] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState(
    initialState.quizQuestions,
  );
  const [quizShownQuestionsCount, setQuizShownQuestionsCount] = useState(
    initialState.quizShownQuestionsCount,
  );

  const [firstMessage, setFirstMessage] = useState(initialState.firstMessage);
  const [controlGroup, setControlGroup] = useState(initialState.controlGroup);
  const [completionFunctionDescription, setCompletionFunctionDescription] =
    useState(initialState.completionFunctionDescription);

  const weeks = useQuery(api.admin.weeks.list, {});
  const generateImage = useAction(api.admin.image.generate);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        onSubmit({
          name,
          instructions,
          image,
          model,
          text,
          weekId,
          quizQuestions,
          quizShownQuestionsCount,
          firstMessage,
          controlGroup,
          completionFunctionDescription,
        });
      }}
    >
      <Input
        label="Name"
        value={name}
        onChange={setName}
        placeholder="Bogo Sort"
        required
      />

      {weeks && (
        <Select
          label="Week"
          value={weekId}
          onChange={(val) => setWeekId(val)}
          values={weeks.map((week) => ({ value: week.id, label: week.name }))}
        />
      )}

      <div className="grid md:grid-cols-2 gap-x-12">
        <label className="block mb-6 text-sm font-medium text-slate-800">
          Image
          <div className="flex flex-wrap gap-2 mt-1">
            {imagePrompt !== undefined && (
              <input
                className="p-2 w-full border border-slate-300 rounded-md text-base disabled:bg-slate-200 disabled:cursor-not-allowed flex-1"
                value={imagePrompt ?? ""}
                onChange={(e) => setImagePrompt(e.target.value)}
                required
                disabled={imageLoading}
              />
            )}

            <button
              type="button"
              className="font-medium px-4 py-2 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200 flex items-center gap-1 disabled:cursor-not-allowed disabled:bg-slate-200"
              onClick={async () => {
                // Set a default prompt
                const prompt =
                  imagePrompt ??
                  `Generate an cartoon-style image representing ${name}`;
                setImagePrompt(prompt);
                setImageLoading(true);

                const image = await generateImage({
                  prompt,
                });
                setImage(image);
                setImageLoading(false);
              }}
              disabled={imageLoading}
            >
              Generate
            </button>
          </div>
        </label>

        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mb-6" src={image} alt="" />
        ) : imageLoading ? (
          <div className="bg-slate-200 animate-pulse rounded aspect-video"></div>
        ) : null}
      </div>

      <Select
        label="Control group"
        value={controlGroup}
        onChange={(val) => setControlGroup(val)}
        values={(["A", "B"] as const).map((value) => ({ value, label: value }))}
        hint={
          <>
            This group of students will get the reading exercise, while the
            other group will get the explanation exercise.
          </>
        }
      />

      <section>
        <h2 className="text-2xl font-medium mt-8 mb-4 border-t py-4 border-slate-300">
          Explanation Exercise
        </h2>
        <div className="grid md:grid-cols-2 gap-x-12">
          <Textarea
            label="First message"
            value={firstMessage}
            onChange={setFirstMessage}
            hint={
              <>
                This message will be sent automatically{" "}
                <strong>on the user’s behalf</strong> when starting the
                exercise. This message, and the one sent by the chat bot in
                reponse, will be visible to students.
              </>
            }
          />
          <div className="mt-6 flex justify-end items-start">
            {firstMessage.trim() && (
              <div className="inline-block p-4 rounded-xl shadow bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-br-none ml-auto">
                <p className="prose text-white whitespace-pre-wrap">
                  {firstMessage}
                </p>
              </div>
            )}
          </div>
        </div>
        <Select
          label="Model"
          value={model}
          onChange={setModel}
          values={[
            "gpt-4",
            "gpt-4-turbo-preview",
            "gpt-4-0125-preview",
            "gpt-4-1106-preview",
            "gpt-4-0613",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-0125",
            "gpt-3.5-turbo-1106",
            "gpt-3.5-turbo-0613",
          ].map((value) => ({ value, label: value }))}
          hint={
            <>
              More information about the models can be found in the{" "}
              <a
                className="underline font-semibold"
                href="https://platform.openai.com/docs/models/overview"
                target="_blank"
              >
                OpenAI documentation
              </a>
              .
            </>
          }
        />
        <Textarea
          label="Model instructions"
          value={instructions}
          onChange={setInstructions}
          required
          hint="Not visible to the students."
        />
        <Input
          label="Completion function description"
          value={completionFunctionDescription}
          onChange={setCompletionFunctionDescription}
          required
          hint={
            <>
              <a
                className="underline font-semibold"
                href="https://platform.openai.com/docs/guides/function-calling"
                target="_blank"
              >
                Function calling
              </a>{" "}
              is used to determine when the explanation exercise is complete.
            </>
          }
        />
      </section>

      <section>
        <h2 className="text-2xl font-medium mt-8 mb-4 border-t py-4 border-slate-300">
          Reading Exercise
        </h2>
        <div className="grid md:grid-cols-2 gap-x-12">
          <Textarea
            label="Text"
            value={text}
            onChange={setText}
            hint={<MarkdownTip />}
            required
          />

          <div className="mt-6">
            <Markdown text={text} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-medium mt-8 mb-4 border-t py-4 border-slate-300">
          Validation Quiz
        </h2>
        {quizQuestions.map((question, questionIndex) => (
          <QuizQuestion
            key={questionIndex}
            question={question}
            onChange={(question) => {
              setQuizQuestions((questions) =>
                questions.map((q, index) =>
                  index === questionIndex ? question : q,
                ),
              );
            }}
            showDeleteButton={quizQuestions.length > 1}
            onDelete={() => {
              setQuizQuestions((questions) =>
                questions.filter((_, index) => index !== questionIndex),
              );
            }}
          />
        ))}

        <div className="flex flex-wrap items-center">
          <p className="text-slate-500 mb-6 text-sm flex-1 gap-2">
            <MarkdownTip />
          </p>
          <button
            type="button"
            className="font-medium px-4 py-2 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200 flex items-center gap-1"
            onClick={() => {
              setQuizQuestions((questions) => [
                ...questions,
                {
                  question: "Question",
                  answers: ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
                  correctAnswerIndex: null,
                },
              ]);
            }}
          >
            <PlusIcon className="w-5 h-5" />
            New Question
          </button>
        </div>

        <Input
          label="Number of questions to show to each student"
          type="number"
          value={quizShownQuestionsCount.toString()}
          onChange={(val) => setQuizShownQuestionsCount(parseInt(val, 10))}
          required
          min={1}
          max={quizQuestions.length}
          step={1}
        />
      </section>

      <hr className="my-4 border-slate-300" />
      <div className="pb-10">
        <button
          type="submit"
          className="bg-slate-500 text-white py-2 px-4 rounded-md"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function QuizQuestion({
  question,
  onChange,
  showDeleteButton,
  onDelete,
}: {
  question: Question;
  onChange: (question: Question) => void;
  showDeleteButton: boolean;
  onDelete: () => void;
}) {
  const correctAnswerName = useId();

  return (
    <div className="grid md:grid-cols-2 gap-x-12 mb-8">
      <div>
        <label className="block mb-6 text-sm font-medium text-slate-800">
          Question
          <div className="flex">
            <input
              className="mt-1 p-2 w-full border border-slate-300 rounded-md text-base disabled:bg-slate-200 disabled:cursor-not-allowed"
              value={question.question}
              onChange={(e) =>
                onChange({ ...question, question: e.target.value })
              }
              required
            />
            {showDeleteButton && (
              <button
                type="button"
                className="ml-3 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => {
                  onDelete();
                }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </label>

        <fieldset className="md:pl-6">
          <legend className="block text-sm font-medium text-slate-800">
            Answers
          </legend>
          {question.answers.map((answer, answerIndex) => (
            <div key={answerIndex} className="mb-1 flex">
              <label className="flex items-center w-8 px-2">
                <input
                  type="radio"
                  name={correctAnswerName}
                  value={answerIndex}
                  checked={question.correctAnswerIndex === answerIndex}
                  onChange={() => {
                    onChange({ ...question, correctAnswerIndex: answerIndex });
                  }}
                  required
                />
              </label>

              <input
                type="text"
                className="mt-1 p-2 w-full border border-slate-300 rounded-md text-base disabled:bg-slate-200 disabled:cursor-not-allowed flex-1"
                value={answer}
                onChange={(e) => {
                  onChange({
                    ...question,
                    answers: question.answers.map((a, index) =>
                      index === answerIndex ? e.target.value : a,
                    ),
                  });
                }}
                required
              />

              {question.answers.length > 1 && (
                <button
                  type="button"
                  className="ml-3 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => {
                    onChange({
                      ...question,
                      answers: question.answers.filter(
                        (_, index) => index !== answerIndex,
                      ),
                    });
                  }}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="font-medium text-blue-800 flex items-center py-2"
            onClick={() => {
              onChange({
                ...question,
                answers: [...question.answers, ""],
              });
            }}
          >
            <div className="w-8 flex justify-center">
              <PlusIcon className="w-5 h-5" />
            </div>
            Add Answer
          </button>
        </fieldset>
      </div>

      <div className="mt-6">
        <QuizContents
          question={question.question}
          answers={question.answers}
          selectedAnswerIndex={null}
          correctAnswerIndex={question.correctAnswerIndex}
          disabled
        />
      </div>
    </div>
  );
}
