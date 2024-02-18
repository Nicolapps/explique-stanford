import { ActionCtx, DatabaseWriter, internalQuery } from "./_generated/server";
import { User } from "lucia";
import { Doc } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";

export async function validateDueDate(
  db: DatabaseWriter, // In order to avoid calling this from cached queries
  exercise: Doc<"exercises">,
  user: User,
) {
  const now = Date.now();

  const week = await db.get(exercise.weekId);
  if (week === null) {
    throw new Error("Week not found");
  }

  if (week.startDate > now && !user.earlyAccess && !user.isAdmin) {
    throw new ConvexError("This exercise hasn’t been released yet.");
  }

  if (now >= week.endDate && !(user.extraTime && now < week.endDateExtraTime)) {
    throw new ConvexError("This exercise due date has passed.");
  }
}

export async function validateDueDateFromAction(
  ctx: Omit<ActionCtx, "auth">,
  exercise: Doc<"exercises">,
  user: User,
) {
  const now = Date.now();

  const week = await ctx.runQuery(internal.weeks.getWeekDateFields, {
    id: exercise.weekId,
  });
  if (week === null) {
    throw new Error("Week not found");
  }

  if (week.startDate > now && !user.earlyAccess && !user.isAdmin) {
    throw new ConvexError("This exercise hasn’t been released yet.");
  }

  if (now >= week.endDate && !(user.extraTime && now < week.endDateExtraTime)) {
    throw new ConvexError("This exercise due date has passed.");
  }
}

export const getWeekDateFields = internalQuery({
  args: {
    id: v.id("weeks"),
  },
  handler: async ({ db }, { id }) => {
    const week = await db.get(id);
    if (week === null) {
      return null;
    }

    return {
      startDate: week.startDate,
      endDate: week.endDate,
      endDateExtraTime: week.endDateExtraTime,
    };
  },
});
