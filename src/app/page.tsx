"use client";

import { useSessionId } from "@/components/SessionProvider";
import { useConvex } from "convex/react";
import type { NextPage } from "next";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

const RootPage: NextPage = () => {
  const convex = useConvex();
  const sessionId = useSessionId();
  const router = useRouter();

  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) {
      return;
    }
    executed.current = true;

    (async () => {
      if (sessionId === null) {
        router.push("/login");
        return;
      }

      const result = await convex.query(api.courses.getMostRecentRegistration, {
        sessionId,
      });

      if (result === null) {
        router.push("/login");
        return;
      }

      router.replace(`/${result.slug}`);
    })();
  });

  return null;
};

export default RootPage;
