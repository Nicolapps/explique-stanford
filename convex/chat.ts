import {
  internalAction,
  internalMutation,
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

    const rows = await db
      .query("messages")
      .withIndex("by_attempt", (x) => x.eq("attemptId", attemptId))
      .collect();

    return rows.map(({ _id: id, system, content, appearance }) => ({
      id,
      system,
      content,
      appearance,
    }));
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

export const editMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    appearance: v.optional(v.union(v.literal("finished"), v.literal("error"))),
  },
  handler: async ({ db }, { messageId, content, appearance }) => {
    await db.patch(messageId, { content, appearance });
  },
});

export const sendMessage = mutationWithAuth({
  args: {
    attemptId: v.id("attempts"),
    message: v.string(),
  },
  handler: async ({ db, scheduler, session }, { attemptId, message }) => {
    const attempt = await getAttemptIfAuthorized(db, session, attemptId);
    if (attempt.threadId === null)
      throw new ConvexError("Not doing the explanation exercise");

    const exercise = await db.get(attempt.exerciseId);
    if (!exercise) throw new Error(`Exercise ${attempt.exerciseId} not found`);

    await db.insert("messages", { attemptId, system: false, content: message });

    const systemMessageId = await db.insert("messages", {
      attemptId,
      system: true,
      appearance: "typing",
      content: "",
    });

    scheduler.runAfter(0, internal.chat.answer, {
      attemptId,
      message,
      threadId: attempt.threadId,
      assistantId: exercise.assistantId,
      systemMessageId,
    });
  },
});

export const answer = internalAction({
  args: {
    threadId: v.string(),
    attemptId: v.id("attempts"),
    message: v.string(),
    assistantId: v.string(),
    systemMessageId: v.id("messages"),
  },
  handler: async (
    ctx,
    { threadId, attemptId, message, assistantId, systemMessageId },
  ) => {
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
      systemMessageId,
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

    const attempt = await ctx.db.get(attemptId);
    if (!attempt) {
      throw new Error("Can’t find the attempt");
    }
    if (attempt.status === "exercise") {
      await ctx.db.patch(attemptId, { status: "exerciseCompleted" });
    }
  },
});

export const checkAnswer = internalAction({
  args: {
    threadId: v.string(),
    runId: v.string(),
    attemptId: v.id("attempts"),
    lastMessageId: v.string(),
    systemMessageId: v.id("messages"),
  },
  handler: async (
    { runMutation, scheduler },
    { runId, threadId, attemptId, lastMessageId, systemMessageId },
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
        await runMutation(internal.chat.editMessage, {
          messageId: systemMessageId,
          appearance: "error",
          content: "",
        });
        return;
      case "completed":
        const { data: newMessages } = await openai.beta.threads.messages.list(
          threadId,
          { after: lastMessageId, order: "asc" },
        );

        const text = newMessages
          .flatMap(({ content }) => content)
          .filter((item): item is MessageContentText => item.type === "text")
          .map(({ text }) => text.value)
          .join("\n\n");
        await runMutation(internal.chat.editMessage, {
          messageId: systemMessageId,
          appearance: undefined,
          content: text,
        });
        return;
    }

    await scheduler.runAfter(1000, internal.chat.checkAnswer, {
      runId,
      threadId,
      attemptId,
      lastMessageId,
      systemMessageId,
    });
  },
});
