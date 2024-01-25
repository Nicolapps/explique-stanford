import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {
    id: v.id("attempts"),
  },
  handler: async ({ db }, { id }) => {
    const attempt = await db.get(id);
    if (attempt === null) throw new Error("No attempt");

    const exercise = await db.get(attempt.exerciseId);
    if (exercise === null) throw new Error("No exercise");

    return {
      attempt,
      exercise,
    };
  },
});
