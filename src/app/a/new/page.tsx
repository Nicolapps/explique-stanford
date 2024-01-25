"use client";

import { useAction } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const startAttempt = useAction(api.exercises.startAttempt);

  const executed = useRef(false);
  useEffect(() => {
    const exerciseIdStr =
      new URLSearchParams(window.location.search).get("exerciseId") ?? null;
    if (executed.current || !exerciseIdStr) {
      return;
    }
    executed.current = true;

    (async () => {
      const newAttemptId = await startAttempt({
        exerciseId: exerciseIdStr as Id<"exercises">,
      });
      console.log({ newAttemptId });
      router.push(`/a/${newAttemptId}`);
      window.location.href = "/";
    })();
  });

  return null;
}
