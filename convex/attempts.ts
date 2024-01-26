import { ConvexError, v } from "convex/values";
import { queryWithAuth } from "./withAuth";

export const get = queryWithAuth({
  args: {
    id: v.id("attempts"),
  },
  handler: async ({ db, session }, { id }) => {
    const attempt = await db.get(id);
    if (attempt === null) throw new ConvexError("Unknown attempt");

    if (attempt.userId !== session?.user._id && !session?.user.isAdmin) {
      throw new Error("Attempt from someone else");
    }

    const exercise = await db.get(attempt.exerciseId);
    if (exercise === null) throw new Error("No exercise");

    return {
      attempt,
      exercise,
    };
  },
});
