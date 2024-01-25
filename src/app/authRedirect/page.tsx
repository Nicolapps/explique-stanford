"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef } from "react";
import { useSetSessionId } from "@/components/SessionProvider";

export default function Page() {
  const authMutation = useAction(api.auth.redirect);
  const setSessionId = useSetSessionId();

  const executed = useRef(false);
  useEffect(() => {
    const code =
      new URLSearchParams(window.location.search).get("code") ?? null;
    if (executed.current || !code) {
      return;
    }
    executed.current = true;

    (async () => {
      const newSessionId = await authMutation({ code });
      setSessionId(newSessionId);
      window.location.href = "/";
    })();
  });

  return null;
}
