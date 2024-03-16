import { createContext, useCallback, useContext, useState } from "react";

const SessionContext = createContext(undefined as any);

export function useSessionId(): string | null {
  return useContext(SessionContext).sessionId;
}

export function useSetSession() {
  return useContext(SessionContext).setSession;
}

type Identity = {
  name: string;
  email: string;
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState(getSavedSessionId());
  const [identity, setIdentity] = useState(getSavedIdentity());

  const setSession = useCallback(
    (sessionId: string | null, identity: Identity | null) => {
      setSavedSessionId(sessionId);
      setSessionId(sessionId);

      setSavedIdentity(identity);
      setIdentity(identity);
    },
    [setSessionId, setIdentity],
  );

  return (
    <SessionContext.Provider value={{ sessionId, identity, setSession }}>
      {children}
    </SessionContext.Provider>
  );
}

function getSavedSessionId() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("sessionId");
}

export function setSavedSessionId(sessionId: string | null) {
  if (sessionId == null) {
    localStorage.removeItem("sessionId");
  } else {
    localStorage.setItem("sessionId", sessionId);
  }
}

function getSavedIdentity() {
  if (typeof localStorage === "undefined") return null;
  const json = localStorage.getItem("identity");
  return json
    ? (JSON.parse(json) as {
        name: string;
        email: string;
      })
    : null;
}

export function setSavedIdentity(
  identity: {
    name: string;
    email: string;
  } | null,
) {
  if (identity == null) {
    localStorage.removeItem("identity");
  } else {
    localStorage.setItem("identity", JSON.stringify(identity));
  }
}
