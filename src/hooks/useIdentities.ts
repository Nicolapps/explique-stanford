import { useSessionId } from "@/components/SessionProvider";
import { useConvex } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { useCourseSlug } from "./useCourseSlug";

export type Identities = Record<string, { email: string }>;

export function useIdentities(): Identities | undefined {
  const convex = useConvex();
  const sessionId = useSessionId();
  const courseSlug = useCourseSlug();

  const [identities, setIdentities] = useState<Identities | undefined>(
    undefined,
  );
  useEffect(() => {
    if (identities) return;

    (async () => {
      const jwt = await convex.query(api.admin.identitiesJwt.default, {
        sessionId,
        courseSlug,
      });

      const req = await fetch("/api/admin/identities", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = await req.json();

      setIdentities(data as Identities);
    })();
  }, [identities, convex, sessionId, courseSlug]);

  return identities;
}
