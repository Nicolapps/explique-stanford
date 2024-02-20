import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";

export default function Title({
  className,
  children,
  backHref,
}: React.PropsWithChildren<{
  className?: string;
  backHref?: string;
}>) {
  return (
    <h1
      className={clsx(
        "font-semibold text-4xl tracking-tight mb-8 flex items-center gap-4",
        className,
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          className="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-full inline-flex items-center justify-center transition-colors"
          title="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
      )}
      {children}
    </h1>
  );
}
