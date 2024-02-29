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
      const urlParams = new URLSearchParams(window.location.search);
      const external = urlParams.has("external") ? true : undefined;

      const redirectUrl = await authUrlAction({
        external,
      });
      window.location.href = redirectUrl;
    })();
  });

  return null;
}
