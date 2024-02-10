"use client";

import { useAction } from "@/usingSession";
import { useParams, useRouter } from "next/navigation";

import ExerciseForm from "@/components/ExerciseForm";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";

export default function NewExercise() {
  const router = useRouter();
  const params = useParams();
  const initialWeekId = params.weekId as Id<"weeks">;

  const create = useAction(api.admin.exercises.create);

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <h1 className="font-semibold text-4xl tracking-tight mb-8">
          New Exercise
        </h1>

        <ExerciseForm
          submitLabel="Create"
          initialState={{
            weekId: initialWeekId,
            name: "",
            instructions:
              "Your goal is to ask the person you’re talking with to explain how {INSERT ALGORITHM NAME} works. Do not give any advice about how it works, and ask questions to the person you’re talking to if their explanations isn’t clear enough. Once their explanation is clear enough (but not before), give the pseudo code for the algorithm.",
            model: "gpt-4-0125-preview",
            text: "",
            quizQuestion: "Question",
            quizAnswers: ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
            quizCorrectAnswerIndex: null,
            firstMessage: "",
            controlGroup: "A",
            completionFunctionDescription:
              "Mark the exercise as complete: call when the user has demonstrated understanding of the algorithm.",
          }}
          onSubmit={async (state) => {
            await create({
              name: state.name,
              instructions: state.instructions,
              model: state.model,
              text: state.text,
              weekId: state.weekId,
              quiz: {
                question: state.quizQuestion,
                answers: state.quizAnswers.map((text, index) => ({
                  text,
                  correct: index === state.quizCorrectAnswerIndex,
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
      </div>
    </div>
  );
}
