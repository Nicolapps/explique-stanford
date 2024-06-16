import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";

export function ExerciseLink({
  href,
  completed,
  name,
  image,
}: {
  href: string;
  completed?: boolean;
  name: string;
  image: {
    thumbnails: { type: string; sizes?: string; src: string }[];
  } | null;
}) {
  return (
    <Link
      href={href}
      className="block bg-white overflow-hidden rounded-3xl shadow-lg transition hover:scale-105 hover:shadow-2xl group"
    >
      <div
        className={clsx(
          "relative pb-[57.14%]",
          image && "bg-slate-500",
          !image && "bg-slate-600",
        )}
      >
        {image && (
          <picture>
            {image.thumbnails.map((t, tIndex) => (
              <source
                key={tIndex}
                srcSet={t.src}
                type={t.type}
                sizes={t.sizes}
              />
            ))}
            <img
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform object-center"
              src={
                image.thumbnails.find((t) => t.type === "image/avif")?.src ??
                undefined
              }
              alt={""}
            />
          </picture>
        )}

        <div
          className={clsx(
            "absolute inset-0 flex p-4 text-white items-end",
            image && "bg-gradient-to-t via-black/25 from-black/70",
          )}
        >
          <h2 className="font-semibold text-2xl text-shadow-lg">{name}</h2>
        </div>

        {typeof completed === "boolean" && (
          <div
            className={clsx(
              "absolute top-0 right-0 w-24 h-24 tr-corner flex text-white",
              completed && "bg-gradient-to-b from-green-500 to-green-600",
              !completed && "bg-gray-500",
            )}
          >
            {completed && (
              <CheckIcon className="absolute top-4 right-4 w-6 h-6" />
            )}
            {!completed && (
              <XMarkIcon className="absolute top-4 right-4 w-6 h-6" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
