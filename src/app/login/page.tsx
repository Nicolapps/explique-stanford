"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

async function getTequilaLoginUrl() {
  const response = await fetch("/api/tequila");
  const data = await response.json();

  if (!data.ok) {
    throw new Error("Unable to log in");
  }

  return data.redirect;
}

export default function Page() {
  const authUrlAction = useAction(api.auth.getLoginUrl);

  const executed = useRef(false);
  useEffect(() => {
    if (executed.current) {
      return;
    }
    executed.current = true;

    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const external = urlParams.has("external") ? true : undefined;
      const internal = urlParams.has("internal") ? true : undefined;

      if (!internal) {
        const redirectUrl = await authUrlAction({
          external,
        });
        window.location.href = redirectUrl;
      } else {
        try {
          window.location.href = await getTequilaLoginUrl();
        } catch (e) {
          toast.error(
            "An error occurred while trying to log in. Please try again.",
          );
          Sentry.captureException(e);
        }
      }
    })();
  });

  return null;
}
