"use client";

import { useAction, useQuery } from "@/usingSession";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import ExerciseForm from "@/components/ExerciseForm";

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
        <h1 className="font-semibold text-4xl tracking-tight mb-8">
          Edit Exercise
        </h1>

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
              model: exercise.model ?? "gpt-4", // @TODO Remove default case
              text: exercise.text,

              quizQuestions: exercise.quiz.questions.map(
                ({ question, answers }) => ({
                  question,
                  answers: answers.map((a) => a.text),
                  correctAnswerIndex: answers.findIndex((a) => a.correct),
                }),
              ),
              quizShownQuestionsCount: exercise.quiz.shownQuestionsCount,

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
                  shownQuestionsCount: state.quizShownQuestionsCount,
                  questions: state.quizQuestions.map(
                    ({ question, answers, correctAnswerIndex }) => ({
                      question,
                      answers: answers.map((text, index) => ({
                        text,
                        correct: index === correctAnswerIndex,
                      })),
                    }),
                  ),
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
