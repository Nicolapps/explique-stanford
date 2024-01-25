import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async ({ db }, {}) => {
    const user = await db.query("users").first();
    if (user === null) throw new Error("No user");

    const result = [];
    for (const exercise of await db.query("exercises").collect()) {
      const attempt = await db
        .query("attempts")
        .withIndex("by_key", (x) =>
          x.eq("userId", user._id).eq("exerciseId", exercise._id),
        )
        .order("desc") // latest attempt
        .first();
      result.push({
        ...exercise,
        attemptId: attempt?._id ?? null,
        completed: attempt?.completed ?? false,
      });
    }
    return result;
  },
});

export const insertAttempt = internalMutation({
  args: {
    completed: v.boolean(),
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    threadId: v.string(),
  },
  handler: async ({ db }, row) => {
    return await db.insert("attempts", row);
  },
});

export const firstUser = internalQuery(async ({ db }) => {
  return await db.query("users").first();
});

export const startAttempt = action({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, { exerciseId }) => {
    const openai = new OpenAI();
    const { id: threadId } = await openai.beta.threads.create();

    // @TODO Use auth
    const user = await ctx.runQuery(internal.exercises.firstUser);

    const attemptId: Id<"attempts"> = await ctx.runMutation(
      internal.exercises.insertAttempt,
      {
        completed: false,
        exerciseId,
        userId: user!._id,
        threadId,
      },
    );
    return attemptId;
  },
});
