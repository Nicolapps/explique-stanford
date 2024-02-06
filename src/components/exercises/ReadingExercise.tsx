import { ArrowRightIcon } from "@heroicons/react/16/solid";
import Markdown from "react-markdown";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function ReadingExercise({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
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

      <Markdown className="prose">{text}</Markdown>

      <footer className="flex justify-center mt-8">
        <button className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700">
          I’m ready
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </footer>
    </>
  );
}
