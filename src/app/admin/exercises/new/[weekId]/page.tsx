"use client";

import { useAction } from "@/usingSession";
import { useParams, useRouter } from "next/navigation";

import ExerciseForm from "@/components/ExerciseForm";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import Title from "@/components/typography";

export default function NewExercise() {
  const router = useRouter();
  const params = useParams();
  const initialWeekId = params.weekId as Id<"weeks">;

  const create = useAction(api.admin.exercises.create);

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <Title backHref="/admin">New Exercise</Title>

        <ExerciseForm
          submitLabel="Create"
          initialState={{
            weekId: initialWeekId,
            name: "",
            image: undefined,
            imagePrompt: undefined,
            instructions:
              "Your goal is to ask the person you’re talking with to explain how {INSERT ALGORITHM NAME} works. Do not give any advice about how it works, and ask questions to the person you’re talking to if their explanations isn’t clear enough. Once their explanation is clear enough (but not before), give the pseudo code for the algorithm.",
            model: "gpt-4-0125-preview",
            text: "",

            quizBatches: [
              {
                questions: [
                  {
                    question: "Question",
                    answers: ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
                    correctAnswerIndex: null,
                  },
                ],
              },
            ],

            firstMessage: "",
            controlGroup: "A",
            completionFunctionDescription:
              "Mark the exercise as complete: call when the user has demonstrated understanding of the algorithm.",
          }}
          onSubmit={async (state) => {
            await create({
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
      </div>
    </div>
  );
}
