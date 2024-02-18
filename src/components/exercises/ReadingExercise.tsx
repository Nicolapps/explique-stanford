import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "@/usingSession";
import Markdown from "../Markdown";

export default function ReadingExercise({
  title,
  text,
  attemptId,
  nextButton,
}: {
  title: string;
  text: string;
  attemptId: Id<"attempts">;
  nextButton: "show" | "hide" | "disable";
}) {
  const goToQuiz = useMutation(api.attempts.goToQuiz);

  return (
    <>
      <p className="text-lg font-light flex items-center justify-center gap-1 my-8">
        <InformationCircleIcon
          className="w-6 h-6 text-purple-700"
          aria-hidden="true"
        />
        <span className="flex-1">
          <strong className="font-medium text-purple-700">
            Read the following text
          </strong>{" "}
          about {title}.
        </span>
      </p>

      <Markdown text={text} />

      <footer className="flex justify-center mt-8">
        {nextButton !== "hide" && (
          <div className="flex flex-col gap-2 items-center">
            <button
              className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
              onClick={async () => {
                await goToQuiz({ attemptId });
              }}
              disabled={nextButton === "disable"}
            >
              Continue
              <ArrowRightIcon className="w-5 h-5" />
            </button>

            <p className="text-lg justify-center gap-1 text-red-600">
              The due date for this exercise has passed.
            </p>
          </div>
        )}
      </footer>
    </>
  );
}
