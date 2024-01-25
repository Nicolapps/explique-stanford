"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef } from "react";

export default function Page() {
  const authUrlAction = useAction(api.auth.getLoginUrl);

  const executed = useRef(false);
  useEffect(() => {
    if (executed.current) {
      return;
    }
    executed.current = true;

    (async () => {
      const url = await authUrlAction();
      window.location.href = url;
    })();
  });

  return null;
}
