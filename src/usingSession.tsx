import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
  useAction as useConvexAction,
  ReactMutation,
} from "convex/react";
import { FunctionReference } from "convex/server";
import { useCallback } from "react";
import { useSessionId } from "./components/SessionProvider";

export function useQuery<
  Args extends { sessionId: string | null },
  Query extends FunctionReference<"query", "public", Args>,
>(
  query: Query,
  args: Omit<Query["_args"], "sessionId"> | "skip",
): Query["_returnType"] | undefined {
  const sessionId = useSessionId();
  return useConvexQuery(
    query,
    args === "skip" ? "skip" : ({ ...args, sessionId } as any),
  );
}

export function useMutation<
  Args extends { sessionId: string | null },
  Mutation extends FunctionReference<"mutation", "public", Args>,
>(
  mutation: Mutation,
): ReactMutation<
  FunctionReference<"mutation", "public", Omit<Mutation["_args"], "sessionId">>
> {
  const doMutation = useConvexMutation(mutation);
  const sessionId = useSessionId();
  return useCallback(
    (args: Omit<Mutation["_args"], "sessionId">) => {
      return doMutation({ ...args, sessionId } as any);
    },
    [doMutation, sessionId],
  ) as any; // We don't support optimistic updates
}

export function useAction<
  Args extends { sessionId: string | null },
  Action extends FunctionReference<"action", "public", Args>,
>(
  action: Action,
): ReactMutation<
  FunctionReference<"mutation", "public", Omit<Action["_args"], "sessionId">>
> {
  const doAction = useConvexAction(action);
  const sessionId = useSessionId();
  return useCallback(
    (args: Omit<Action["_args"], "sessionId">) => {
      return doAction({ ...args, sessionId } as any);
    },
    [doAction, sessionId],
  ) as any; // We don't support optimistic updates
}
