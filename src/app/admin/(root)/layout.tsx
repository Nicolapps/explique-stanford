"use client";

import { DocumentIcon } from "@heroicons/react/20/solid";
import {
  FolderIcon,
  PuzzlePieceIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

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
  return (
    <div className="bg-slate-100 h-full flex flex-col md:flex-row md:justify-center p-10 gap-10">
      <nav className="md:w-48 flex flex-col gap-2">
        <NavLink href="/admin">
          <PuzzlePieceIcon />
          Exercises
        </NavLink>
        <NavLink href="/admin/groups">
          <TagIcon />
          Groups
        </NavLink>
      </nav>
      <div className="max-w-6xl md:flex-1">{children}</div>
    </div>
  );
}
