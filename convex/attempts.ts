import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { actionWithAuth, queryWithAuth } from "./withAuth";

export const get = queryWithAuth({
  args: {
    id: v.id("attempts"),
  },
  handler: async ({ db, session }, { id }) => {
    if (!session) {
      throw new ConvexError("Not logged in");
    }

    const attempt = await db.get(id);
    if (attempt === null) throw new ConvexError("Unknown attempt");

    if (attempt.userId !== session.user._id && !session.user.isAdmin) {
      throw new Error("Attempt from someone else");
    }

    const exercise = await db.get(attempt.exerciseId);
    if (exercise === null) throw new Error("No exercise");

    return {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      status: attempt.status,
      text: attempt.threadId === null ? exercise.text : null,
      quiz:
        attempt.status === "quiz" || attempt.status === "quizCompleted"
          ? {
              question: exercise.quiz.question,
              answers: exercise.quiz.answers.map((a) => a.text), // @TODO Randomize order
            }
          : null,
    };
  },
});

export const insert = internalMutation({
  args: {
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    threadId: v.union(v.string(), v.null()),
  },
  handler: async ({ db }, { exerciseId, userId, threadId }) => {
    return await db.insert("attempts", {
      status: "exercise",
      exerciseId,
      userId,
      threadId,
    });
  },
});

export const start = actionWithAuth({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, { exerciseId }) => {
    if (!ctx.session) throw new ConvexError("Not logged in");
    const userId = ctx.session.user._id;

    const isUsingExplainVariant = await ctx.runQuery(
      internal.attempts.isUsingExplainVariant,
      {
        exerciseId,
        userId,
      },
    );
    let threadId = null;
    if (isUsingExplainVariant) {
      const openai = new OpenAI();
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    const attemptId: Id<"attempts"> = await ctx.runMutation(
      internal.attempts.insert,
      {
        exerciseId,
        userId,
        threadId,
      },
    );
    return attemptId;
  },
});

export const isUsingExplainVariant = internalQuery({
  args: {
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
  },
  handler: async ({ db }, { exerciseId, userId }) => {
    return true; // @TODO
  },
});
