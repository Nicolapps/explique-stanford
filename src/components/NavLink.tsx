import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
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
