"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { useSetSessionId } from "@/components/SessionProvider";
import Link from "next/link";

function LoginError({ retryLink }: { retryLink: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-xl font-light mb-8">
        An error occurred while logging in.
      </p>
      <Link
        className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
        href={retryLink}
      >
        Retry
      </Link>
    </div>
  );
}

async function login(key: string, authCheck: string) {
  const res = await fetch(`/api/tequila?key=${key}&auth_check=${authCheck}`);
  const value = await res.json();

  if (!value.ok) {
    throw new Error("Invalid response");
  }

  return value;
}

export default function Page() {
  const authMutation = useAction(api.auth.redirect);
  const setSessionId = useSetSessionId();
  const [showError, setShowError] = useState(false);

  const executed = useRef(false);
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key") ?? null;
    const authCheck =
      new URLSearchParams(window.location.search).get("auth_check") ?? null;

    if (executed.current || !key || !authCheck) {
      return;
    }
    executed.current = true;

    (async () => {
      try {
        await login(key, authCheck);
        // @TODO
        // window.location.href = "/";
      } catch (e) {
        console.error(e);
        setShowError(true);
      }
    })();
  });

  return showError && <LoginError retryLink="/login" />;
}
