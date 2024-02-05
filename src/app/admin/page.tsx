"use client";

import { useQuery } from "@/usingSession";
import { api } from "../../../convex/_generated/api";

export default function Admin() {
  const weeks = useQuery(api.admin.exercises.list, {});

  return (
    <div className="bg-slate-100 h-full p-10 flex justify-center">
      <div className="max-w-6xl flex-1">
        <h1 className="font-semibold text-4xl tracking-tight mb-8">
          Weeks
        </h1>

        {weeks?.map((week) => (<div key={week._id}>
          <h2>{week.name}</h2>
        </div>))}
      </div>
    </div>
  );
}
