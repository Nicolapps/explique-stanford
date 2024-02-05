"use client";

import { useQuery } from "@/usingSession";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function Admin() {
  const weeks = useQuery(api.admin.exercises.list, {});

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <div className="flex mb-8 gap-4 flex-wrap items-center justify-between">
          <h1 className="font-semibold text-4xl tracking-tight">
            Weeks
          </h1>

          <Link
            href="/admin/newWeek"
            className="font-medium px-4 py-2 rounded-lg bg-blue-100 cursor-pointer hover:bg-blue-200"
          >
            Add Week
          </Link>
        </div>

        {weeks?.map((week) => (<div key={week._id}>
          <h2>{week.name}</h2>
        </div>))}
      </div>
    </div>
  );
}
