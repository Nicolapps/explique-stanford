import { useSessionId } from "@/components/SessionProvider";
import { useConvex } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export type Identities = Record<string, { email: string }>;

export function useIdentities(): Identities | undefined {
  const convex = useConvex();
  const sessionId = useSessionId();

  const [identities, setIdentities] = useState<Identities | undefined>(
    undefined,
  );
  useEffect(() => {
    if (identities) return;

    (async () => {
      const jwt = await convex.query(api.admin.identitiesJwt.default, {
        sessionId,
      });

      const req = await fetch("/api/admin/identities", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = await req.json();

      setIdentities(data as Identities);
    })();
  }, [identities, convex, sessionId]);

  return identities;
}
