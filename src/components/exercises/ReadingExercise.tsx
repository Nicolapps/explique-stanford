import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "@/usingSession";
import Markdown from "../Markdown";
import { PrimaryButton } from "../PrimaryButton";

export default function ReadingExercise({
  hasQuiz,
  text,
  attemptId,
  nextButton,
}: {
  hasQuiz: boolean;
  text: string;
  attemptId: Id<"attempts">;
  nextButton: "show" | "hide" | "disable";
}) {
  const goToQuiz = useMutation(api.attempts.goToQuiz);

  return (
    <>
      <p className="sm:text-lg font-light flex items-center justify-center gap-1 my-8">
        <InformationCircleIcon
          className="w-6 h-6 text-purple-700"
          aria-hidden="true"
        />
        <span className="flex-1">
          <strong className="font-medium text-purple-700">
            Read the following text.
          </strong>
        </span>
      </p>

      <Markdown text={text} />

      <footer className="flex justify-center mt-8">
        {nextButton !== "hide" && (
          <div className="flex flex-col gap-2 items-center">
            <PrimaryButton
              onClick={async () => {
                await goToQuiz({ attemptId });
              }}
              disabled={nextButton === "disable"}
            >
              Continue to the quiz
              <ArrowRightIcon className="w-5 h-5" />
            </PrimaryButton>

            {nextButton === "disable" && (
              <p className="text-lg justify-center gap-1 text-red-600">
                The due date for this exercise has passed.
              </p>
            )}
          </div>
        )}
      </footer>
    </>
  );
}
