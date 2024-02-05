import { ConvexError, v } from "convex/values";
import {
  internalMutation,
} from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { actionWithAuth, queryWithAuth } from "./withAuth";

export const list = queryWithAuth({
  args: {},
  handler: async ({ db, session }, { }) => {
    if (!session) throw new ConvexError("Not logged in");

    const { user } = session;

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

export const startAttempt = actionWithAuth({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, { exerciseId }) => {
    if (!ctx.session) throw new ConvexError("Not logged in");

    const openai = new OpenAI();
    const { id: threadId } = await openai.beta.threads.create();

    const attemptId: Id<"attempts"> = await ctx.runMutation(
      internal.exercises.insertAttempt,
      {
        completed: false,
        exerciseId,
        userId: ctx.session.user._id,
        threadId,
      },
    );
    return attemptId;
  },
});
