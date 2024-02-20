"use client";

import { useAction, useQuery } from "@/usingSession";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import ExerciseForm from "@/components/ExerciseForm";
import Title from "@/components/typography";

export default function EditExercise() {
  const router = useRouter();
  const params = useParams();
  const update = useAction(api.admin.exercises.update);

  const exercise = useQuery(api.admin.exercises.get, {
    id: params.exerciseId as Id<"exercises">,
  });

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <Title backHref="/admin">Edit Exercise</Title>

        {exercise === null && <p>Not found</p>}
        {exercise && (
          <ExerciseForm
            submitLabel="Save"
            initialState={{
              weekId: exercise.weekId,
              name: exercise.name,
              image: exercise.image,
              imagePrompt: exercise.imagePrompt,
              instructions: exercise.instructions,
              model: exercise.model,
              text: exercise.text,

              quizBatches: exercise.quiz.batches.map((batch) => ({
                questions: batch.questions.map(({ question, answers }) => ({
                  question,
                  answers: answers.map((a) => a.text),
                  correctAnswerIndex: answers.findIndex((a) => a.correct),
                })),
              })),

              firstMessage: exercise.firstMessage ?? "",
              controlGroup: exercise.controlGroup,
              completionFunctionDescription:
                exercise.completionFunctionDescription,
            }}
            onSubmit={async (state) => {
              await update({
                id: exercise._id,
                name: state.name,
                image: state.image,
                imagePrompt: state.imagePrompt,
                instructions: state.instructions,
                model: state.model,
                text: state.text,
                weekId: state.weekId,

                quiz: {
                  batches: state.quizBatches.map((batch) => ({
                    questions: batch.questions.map(
                      ({ question, answers, correctAnswerIndex }) => ({
                        question,
                        answers: answers.map((text, index) => ({
                          text,
                          correct: index === correctAnswerIndex,
                        })),
                      }),
                    ),
                  })),
                },

                firstMessage: state.firstMessage,
                controlGroup: state.controlGroup,
                completionFunctionDescription:
                  state.completionFunctionDescription,
              });
              router.push("/admin");
            }}
          />
        )}
      </div>
    </div>
  );
}
