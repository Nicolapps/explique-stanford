"use client";

import { useCourseSlug } from "@/hooks/useCourseSlug";
import { useQuery } from "@/usingSession";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import {
  DocumentCheckIcon,
  TableCellsIcon,
  PuzzlePieceIcon,
  TagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ReactNode } from "react";
import { api } from "../../../../../convex/_generated/api";

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Link
      className={clsx(
        "flex [&>svg]:w-6 [&>svg]:h-6 [&>svg]:mr-2 items-center h-12 px-4 transition-colors rounded-full",
        "hover:bg-slate-200 hover:text-slate-800 font-medium [&>svg]:transition-colors",
        pathname === href
          ? "bg-slate-200 text-slate-900 font-semibold [&>svg]:text-slate-600"
          : "text-slate-700 [&>svg]:text-slate-400",
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const courseSlug = useCourseSlug();
  const registration = useQuery(api.courses.getRegistration, { courseSlug });

  return (
    <div className="bg-slate-100 h-full flex flex-col md:flex-row md:justify-center p-6 sm:p-10 gap-10">
      <nav className="md:w-48 flex flex-col gap-2">
        <Link
          className="flex items-center gap-1 h-10 text-slate-600 hover:text-slate-900 transition-colors"
          href={`/${courseSlug}`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          {registration ? (
            <span>{registration.course.code}</span>
          ) : (
            <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
          )}
        </Link>

        <NavLink href={`/${courseSlug}/admin`}>
          <PuzzlePieceIcon />
          Exercises
        </NavLink>
        <NavLink href={`/${courseSlug}/admin/scores`}>
          <TableCellsIcon />
          Scores
        </NavLink>
        <NavLink href={`/${courseSlug}/admin/researchConsent`}>
          <DocumentCheckIcon />
          Consent
        </NavLink>
        <NavLink href={`/${courseSlug}/admin/groups`}>
          <TagIcon />
          Groups
        </NavLink>
        <NavLink href={`/${courseSlug}/admin/users`}>
          <UserIcon />
          Users
        </NavLink>
      </nav>
      <div className="max-w-6xl md:flex-1">{children}</div>
    </div>
  );
}
