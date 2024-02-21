import {
  internalAction,
  internalMutation,
  DatabaseReader,
  MutationCtx,
  internalQuery,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { MessageContentText } from "openai/resources/beta/threads/messages/messages";
import { mutationWithAuth, queryWithAuth } from "./withAuth";
import { Id } from "./_generated/dataModel";
import { Session } from "lucia";

async function getAttemptIfAuthorized(
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

async function sendMessageController(
  ctx: Omit<MutationCtx, "auth">,
  {
    message,
    attemptId,
  }: {
    attemptId: Id<"attempts">;
    message: string;
  },
) {
  const attempt = await ctx.db.get(attemptId);
  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);

  const exercise = await ctx.db.get(attempt.exerciseId);
  if (!exercise) throw new Error(`Exercise ${attempt.exerciseId} not found`);

  await ctx.db.insert("messages", {
    attemptId,
    system: false,
    content: message,
  });

  const systemMessageId = await ctx.db.insert("messages", {
    attemptId,
    system: true,
    appearance: "typing",
    content: "",
  });

  ctx.scheduler.runAfter(0, internal.chat.answer, {
    attemptId,
    message,
    threadId: attempt.threadId!,
    assistantId: exercise.assistantId,
    systemMessageId,
  });
}

export const sendMessageInternal = internalMutation({
  args: {
    attemptId: v.id("attempts"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await sendMessageController(ctx, args);
  },
});

export const sendMessage = mutationWithAuth({
  args: {
    attemptId: v.id("attempts"),
    message: v.string(),
  },
  handler: async (ctx, { attemptId, message }) => {
    const attempt = await getAttemptIfAuthorized(
      ctx.db,
      ctx.session,
      attemptId,
    );
    if (attempt.threadId === null)
      throw new ConvexError("Not doing the explanation exercise");

    await sendMessageController(ctx, {
      message,
      attemptId,
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
    systemMessageId: v.id("messages"),
  },
  handler: async (ctx, { attemptId, systemMessageId }) => {
    const attempt = await ctx.db.get(attemptId);
    if (!attempt) {
      throw new Error("Can’t find the attempt");
    }
    if (attempt.status === "exercise") {
      await ctx.db.patch(attemptId, { status: "exerciseCompleted" });
    }

    // Start feedback
    const exercise = await ctx.db.get(attempt.exerciseId);
    if (!exercise) {
      throw new Error(
        "Can’t find the exercise for the attempt that was just completed",
      );
    }

    await ctx.db.patch(systemMessageId, {
      content: "",
      appearance: exercise.feedback ? "feedback" : "finished",
    });

    await ctx.db.insert("logs", {
      type: "exerciseCompleted",
      userId: attempt.userId,
      attemptId,
      exerciseId: attempt.exerciseId,
      variant: "explain",
    });

    if (exercise.feedback) {
      ctx.scheduler.runAfter(0, internal.chat.startFeedback, {
        feedbackMessageId: systemMessageId,
        attemptId,
        model: exercise.feedback.model,
        prompt: exercise.feedback.prompt,
      });
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

        await runMutation(internal.chat.markFinished, {
          attemptId,
          systemMessageId,
        });

        await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
          tool_outputs: action.submit_tool_outputs.tool_calls.map(
            (toolCall) => ({
              tool_call_id: toolCall.id,
              output: "OK",
            }),
          ),
        });

        return;
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

export const startFeedback = internalAction({
  args: {
    attemptId: v.id("attempts"),
    feedbackMessageId: v.id("messages"),
    model: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, { attemptId, feedbackMessageId, model, prompt }) => {
    const transcript = await ctx.runQuery(internal.chat.generateTranscript, {
      attemptId,
    });

    const validModels = [
      "gpt-4-1106-preview",
      "gpt-4-vision-preview",
      "gpt-4",
      "gpt-4-0314",
      "gpt-4-0613",
      "gpt-4-32k",
      "gpt-4-32k-0314",
      "gpt-4-32k-0613",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-0301",
      "gpt-3.5-turbo-0613",
      "gpt-3.5-turbo-1106",
      "gpt-3.5-turbo-16k-0613",
    ] as const;
    if (!validModels.includes(model as any)) {
      throw new Error(`Invalid model ${model}`);
    }

    try {
      const openai = new OpenAI();
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: "She no went to the market.",
          },
        ],
        temperature: 0.7,
        max_tokens: 64,
        stream: false,
      });

      await ctx.runMutation(internal.chat.saveFeedback, {
        feedbackMessageId,
        feedback: response.choices[0].message.content!,
      });
    } catch (err) {
      console.error("Feedback error", err);
      await ctx.runMutation(internal.chat.saveFeedback, {
        feedbackMessageId,
        feedback: "error",
      });
    }
  },
});

export const generateTranscript = internalQuery({
  args: {
    attemptId: v.id("attempts"),
  },
  handler: async ({ db }, { attemptId }) => {
    const messages = await db
      .query("messages")
      .withIndex("by_attempt", (q) => q.eq("attemptId", attemptId))
      .filter((q) => q.eq("appearance", undefined))
      .collect();

    return messages
      .map(
        ({ content, system }) =>
          `<message from="${system ? "chatbot" : "student"}">${content}</message>`,
      )
      .join("\n\n");
  },
});

export const saveFeedback = internalMutation({
  args: {
    feedbackMessageId: v.id("messages"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedbackMessageId, {
      content: args.feedback,
    });
  },
});
