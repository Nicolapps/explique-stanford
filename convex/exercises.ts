import { ConvexError, v } from "convex/values";
import { queryWithAuth } from "./withAuth";
import { internalQuery } from "./_generated/server";

export const getRow = internalQuery({
  args: {
    id: v.id("exercises"),
  },
  handler: async ({ db }, { id }) => {
    return await db.get(id);
  },
});

export const list = queryWithAuth({
  args: {},
  handler: async ({ db, session }, {}) => {
    if (!session) throw new ConvexError("Not logged in");

    const { user } = session;

    const weeks = await db
      .query("weeks")
      .withIndex("startDate", (x) => x.lte("startDate", +new Date()))
      .order("desc")
      .collect();
    const exercises = await db.query("exercises").collect();

    const result = [];
    for (const week of weeks) {
      const exercisesResult = [];
      for (const exercise of exercises.filter((x) => x.weekId === week._id)) {
        const attempt = await db
          .query("attempts")
          .withIndex("by_key", (x) =>
            x.eq("userId", user._id).eq("exerciseId", exercise._id),
          )
          .order("desc") // latest attempt
          .first();
        exercisesResult.push({
          id: exercise._id,
          name: exercise.name,
          attemptId: attempt?._id ?? null,
          completed: attempt?.status === "quizCompleted" ?? false,
        });
      }

      result.push({
        id: week._id,
        name: week.name,
        startDate: week.startDate,
        endDate: week.endDate,
        endDateExtraTime: week.endDateExtraTime,
        exercises: exercisesResult,
      });
    }
    return result;
  },
});
