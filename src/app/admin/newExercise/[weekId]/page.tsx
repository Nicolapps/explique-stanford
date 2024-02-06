"use client";

import { useAction, useQuery } from "@/usingSession";
import { api } from "../../../../../convex/_generated/api";
import React, { useState } from "react";
import Input, { Select, Textarea } from "@/components/Input";
import { useParams, useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { Id } from "../../../../../convex/_generated/dataModel";
import Quiz from "@/components/Quiz";
import { PlusIcon } from "@heroicons/react/16/solid";
import { TrashIcon, XMarkIcon } from "@heroicons/react/20/solid";

export default function NewExercise() {
  const router = useRouter();
  const params = useParams();
  const { weekId } = params;

  const create = useAction(api.admin.exercises.create);
  const weekName = useQuery(
    api.admin.weeks.getName,
    typeof weekId === "string"
      ? {
          weekId: weekId as Id<"weeks">,
        }
      : "skip",
  );
  console.log({ weekId, weekName });

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState(
    "Your goal is to ask the person you’re talking with to explain how {INSERT ALGORITHM NAME} works. Do not give any advice about how it works, and ask questions to the person you’re talking to if their explanations isn’t clear enough. Once their explanation is clear enough (but not before), give the pseudo code for the algorithm.",
  );
  const [model, setModel] = useState("gpt-4-0125-preview");
  const [text, setText] = useState("");

  const [quizQuestion, setQuizQuestion] = useState("Question");
  const [quizAnswers, setQuizAnswers] = useState<string[]>([
    "Answer 1",
    "Answer 2",
    "Answer 3",
    "Answer 4",
  ]);
  const [quizCorrectAnswerIndex, setQuizCorrectAnswerIndex] = useState<
    number | null
  >(null);

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <h1 className="font-semibold text-4xl tracking-tight mb-8">
          New Exercise
        </h1>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            await create({
              name,
              instructions,
              model,
              text,
              weekId: weekId as Id<"weeks">,
              quiz: {
                question: quizQuestion,
                answers: quizAnswers.map((text, index) => ({
                  text,
                  correct: index === quizCorrectAnswerIndex,
                })),
              },
            });

            router.push("/admin");
          }}
        >
          <Input
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Bogo Sort"
            required
          />

          <Input
            label="Week"
            value={weekName ?? ""}
            onChange={() => {}}
            disabled
          />

          <section>
            <h2 className="text-2xl font-medium mt-8 mb-4 border-t py-4 border-slate-300">
              Explaination Exercise
            </h2>
            <Textarea
              label="Instructions"
              value={instructions}
              onChange={setInstructions}
              required
            />
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
              ]}
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
                hint={
                  <>
                    <a
                      className="underline font-semibold"
                      href="https://www.markdownguide.org/basic-syntax/"
                      target="_blank"
                    >
                      Markdown
                    </a>{" "}
                    syntax is supported.
                  </>
                }
                required
              />

              <div>
                <Markdown className={"prose"}>{text}</Markdown>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-medium mt-8 mb-4 border-t py-4 border-slate-300">
              Validation Quiz
            </h2>

            <div className="grid md:grid-cols-2 gap-x-12 items-center">
              <div>
                <Input
                  label="Question"
                  value={quizQuestion}
                  onChange={setQuizQuestion}
                  required
                />

                <fieldset>
                  <legend className="block text-sm font-medium text-slate-800">
                    Answers
                  </legend>
                  {quizAnswers.map((answer, index) => (
                    <div key={index} className="mb-1 flex">
                      <label className="flex items-center pr-4">
                        <input
                          type="radio"
                          name="correct-answer"
                          value={index}
                          checked={quizCorrectAnswerIndex === index}
                          onChange={() => setQuizCorrectAnswerIndex(index)}
                          required
                        />
                      </label>

                      <input
                        type="text"
                        className="mt-1 p-2 w-full border border-slate-300 rounded-md text-base disabled:bg-slate-200 disabled:cursor-not-allowed"
                        value={answer}
                        onChange={(e) => {
                          setQuizAnswers((answers) => {
                            const newAnswers = [...answers];
                            newAnswers[index] = e.target.value;
                            return newAnswers;
                          });
                        }}
                        required
                      />

                      {quizAnswers.length > 1 && (
                        <button
                          type="button"
                          className="ml-3 text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => {
                            setQuizAnswers((answers) => {
                              const newAnswers = [...answers];
                              newAnswers.splice(index, 1);
                              return newAnswers;
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
                      setQuizAnswers((answers) => [...answers, ""]);
                    }}
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Answer
                  </button>
                </fieldset>

                <p className="text-slate-500 mt-2 text-sm">
                  <a
                    className="underline font-semibold"
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="_blank"
                  >
                    Markdown
                  </a>{" "}
                  syntax is supported.
                </p>
              </div>

              <div>
                <Quiz
                  question={quizQuestion}
                  answers={quizAnswers}
                  selectedAnswerIndex={quizCorrectAnswerIndex}
                  disabled
                />
              </div>
            </div>
          </section>

          <hr className="my-4 border-slate-300" />
          <div className="pb-10">
            <button
              type="submit"
              className="bg-slate-500 text-white py-2 px-4 rounded-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
