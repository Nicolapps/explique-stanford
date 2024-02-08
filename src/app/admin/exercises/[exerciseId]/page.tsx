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
              instructions: exercise.instructions,
              model: exercise.model ?? "gpt-4", // @TODO Remove default case
              text: exercise.text,
              quizQuestion: exercise.quiz.question,
              quizAnswers: exercise.quiz.answers.map((a) => a.text),
              quizCorrectAnswerIndex: exercise.quiz.answers.findIndex(
                (a) => a.correct,
              ),
            }}
            onSubmit={async (state) => {
              await update({
                id: exercise._id,
                name: state.name,
                instructions: state.instructions,
                model: state.model,
                text: state.text,
                weekId: exercise.weekId,
                quiz: {
                  question: state.quizQuestion,
                  answers: state.quizAnswers.map((text, index) => ({
                    text,
                    correct: index === state.quizCorrectAnswerIndex,
                  })),
                },
              });
              router.push("/admin");
            }}
          />
        )}
      </div>
    </div>
  );
}
