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

export const getLastAttempt = queryWithAuth({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async ({ db, session }, { exerciseId }) => {
    if (!session) {
      throw new ConvexError("Not logged in");
    }

    const attempt = await db
      .query("attempts")
      .withIndex("by_key", (x) =>
        x.eq("userId", session.user._id).eq("exerciseId", exerciseId),
      )
      .order("desc") // latest attempt
      .first();

    return attempt ? attempt._id : null;
  },
});

export const list = queryWithAuth({
  args: {},
  handler: async ({ db, session }, {}) => {
    if (!session) throw new ConvexError("Not logged in");

    const { user } = session;

    const now = +new Date();
    const weeks = await db
      .query("weeks")
      .withIndex(
        "startDate",
        user.earlyAccess || user.isAdmin
          ? undefined
          : (x) => x.lte("startDate", now),
      )
      .order("desc")
      .collect();
    const exercises = await db.query("exercises").collect();

    const result = [];
    for (const week of weeks) {
      const exercisesResult = [];
      for (const exercise of exercises.filter((x) => x.weekId === week._id)) {
        exercisesResult.push({
          id: exercise._id,
          name: exercise.name,
          image: exercise.image,
          // @TODO Make non-optional
          completed: (user.completedExercises ?? []).includes(exercise._id),
        });
      }

      result.push({
        id: week._id,
        name: week.name,
        startDate: week.startDate,
        endDate: week.endDate,
        endDateExtraTime: user.extraTime ? week.endDateExtraTime : null,
        exercises: exercisesResult,
        preview: week.startDate > now,
      });
    }
    return result;
  },
});
