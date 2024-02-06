"use client";

import { useAction, useQuery } from "@/usingSession";
import { api } from "../../../../../convex/_generated/api";
import React, { useState } from "react";
import Input, { Select, Textarea } from "@/components/Input";
import { useParams, useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { Id } from "../../../../../convex/_generated/dataModel";

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

  // @TODO Quiz

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <h1 className="font-semibold text-4xl tracking-tight mb-8">
          New Exercise
        </h1>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            // @TODO Submit
            await create({
              name,
              instructions,
              model,
              text,
              weekId: weekId as Id<"weeks">,
            });

            router.push("/admin");
          }}
        >
          <Input
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Bogo Sort"
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
            <div className="grid md:grid-cols-2 gap-x-8">
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
            @TODO
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
