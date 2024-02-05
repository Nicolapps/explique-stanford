import {
  query,
  internalAction,
  internalMutation,
  mutation,
  DatabaseReader,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { MessageContentText } from "openai/resources/beta/threads/messages/messages";
import { mutationWithAuth, queryWithAuth } from "./withAuth";
import { Id } from "./_generated/dataModel";
import { Session } from "lucia";

export async function getAttemptIfAuthorized(
  db: DatabaseReader,
  session: Session | null,
  attemptId: Id<"attempts">,
) {
  if (!session) {
    throw new ConvexError("Logged out");
  }

  const attempt = await db.get(attemptId);
  if (attempt === null) throw new ConvexError("Unknown attempt");
  if (attempt.userId !== session.user._id && !session.user.isAdmin) {
    throw new ConvexError("Forbidden");
  }

  return attempt;
}

// Returns the messages for attempt
export const getMessages = queryWithAuth({
  args: {
    attemptId: v.id("attempts"),
  },
  handler: async ({ db, session }, { attemptId }) => {
    await getAttemptIfAuthorized(db, session, attemptId);

    return await db
      .query("messages")
      .withIndex("by_attempt", (x) => x.eq("attemptId", attemptId))
      .collect();
  },
});

export const insertMessage = internalMutation({
  args: {
    attemptId: v.id("attempts"),
    system: v.boolean(),
    content: v.string(),
    appearance: v.optional(v.literal("finished")),
  },
  handler: async ({ db }, { attemptId, system, content }) => {
    return await db.insert("messages", { attemptId, system, content });
  },
});

export const sendMessage = mutationWithAuth({
  args: {
    attemptId: v.id("attempts"),
    message: v.string(),
  },
  handler: async ({ db, scheduler, session }, { attemptId, message }) => {
    const attempt = await getAttemptIfAuthorized(db, session, attemptId);

    const exercise = await db.get(attempt.exerciseId);
    if (!exercise) throw new Error(`Exercise ${attempt.exerciseId} not found`);

    await db.insert("messages", { attemptId, system: false, content: message });

    scheduler.runAfter(0, internal.chat.answer, {
      attemptId,
      message,
      threadId: attempt.threadId,
      assistantId: exercise.assistantId,
    });
  },
});

export const answer = internalAction({
  args: {
    threadId: v.string(),
    attemptId: v.id("attempts"),
    message: v.string(),
    assistantId: v.string(),
  },
  handler: async (ctx, { threadId, attemptId, message, assistantId }) => {
    const openai = new OpenAI();

    // Add the user message to the thread
    const { id: lastMessageId } = await openai.beta.threads.messages.create(
      threadId,
      { role: "user", content: message },
    );

    const { id: runId } = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    await ctx.scheduler.runAfter(500, internal.chat.checkAnswer, {
      runId,
      threadId,
      attemptId,
      lastMessageId,
    });
  },
});

export const markFinished = internalMutation({
  args: {
    attemptId: v.id("attempts"),
  },
  handler: async (ctx, { attemptId }) => {
    await ctx.db.insert("messages", {
      attemptId,
      system: true,
      content: "",
      appearance: "finished",
    });
    await ctx.db.patch(attemptId, { completed: true });
  },
});

export const checkAnswer = internalAction({
  args: {
    threadId: v.string(),
    runId: v.string(),
    attemptId: v.id("attempts"),
    lastMessageId: v.string(),
  },
  handler: async (
    { runMutation, scheduler },
    { runId, threadId, attemptId, lastMessageId },
  ) => {
    const openai = new OpenAI();
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    switch (run.status) {
      case "requires_action":
        const action = run.required_action;
        if (action === null) throw new Error("Unexpected null action");

        await runMutation(internal.chat.markFinished, { attemptId });

        await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
          tool_outputs: action.submit_tool_outputs.tool_calls.map(
            (toolCall) => ({
              tool_call_id: toolCall.id,
              output: "OK",
            }),
          ),
        });

        break;
      case "failed":
      case "expired":
      case "cancelled":
        console.error("Run failed with status ", run.status, run);
        return;
      case "completed":
        const { data: newMessages } = await openai.beta.threads.messages.list(
          threadId,
          { after: lastMessageId, order: "asc" },
        );

        for (const { content } of newMessages) {
          const text = content
            .filter((item): item is MessageContentText => item.type === "text")
            .map(({ text }) => text.value)
            .join("\n\n");
          await runMutation(internal.chat.insertMessage, {
            attemptId,
            system: true,
            content: text,
          });
        }
        return;
    }

    await scheduler.runAfter(500, internal.chat.checkAnswer, {
      runId,
      threadId,
      attemptId,
      lastMessageId,
    });
  },
});
