import { ConvexError, v } from "convex/values";
import { mutationWithAuth, queryWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";
import { Id } from "../_generated/dataModel";
import { MutationCtx, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { getCourseRegistration } from "../courses";

export const list = queryWithAuth({
  args: {},
  handler: async ({ db, session }) => {
    validateAdminSession(session);

    return (await db.query("weeks").collect()).map((week) => ({
      id: week._id,
      name: week.name,
    }));
  },
});

export const getInternal = internalQuery({
  args: {
    id: v.id("weeks"),
  },
  handler: async ({ db }, { id }) => {
    return await db.get(id);
  },
});

export const get = queryWithAuth({
  args: {
    id: v.id("weeks"),
  },
  handler: async ({ db, session }, { id }) => {
    validateAdminSession(session);

    return await db.get(id);
  },
});

async function scheduleWeekChangesInvalidation(
  ctx: Omit<MutationCtx, "auth">,
  weekId: Id<"weeks">,
) {
  const week = await ctx.db.get(weekId);
  if (!week) {
    throw new Error("Week not found");
  }

  for (const date of [week.startDate, week.endDate, week.endDateExtraTime]) {
    ctx.scheduler.runAt(date, internal.weeks.invalidateCache, { weekId });
  }
}

export const create = mutationWithAuth({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    endDateExtraTime: v.number(),
    courseSlug: v.string(),
  },
  handler: async (
    ctx,
    { name, startDate, endDate, endDateExtraTime, courseSlug },
  ) => {
    const { course } = await getCourseRegistration(
      ctx.db,
      ctx.session,
      courseSlug,
      "admin",
    );

    const weekId = await ctx.db.insert("weeks", {
      name,
      startDate,
      endDate,
      endDateExtraTime,
      courseId: course._id,
    });
    await scheduleWeekChangesInvalidation(ctx, weekId);
  },
});

export const update = mutationWithAuth({
  args: {
    id: v.id("weeks"),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    endDateExtraTime: v.number(),
  },
  handler: async (ctx, { id, name, startDate, endDate, endDateExtraTime }) => {
    validateAdminSession(ctx.session);

    const week = await ctx.db.get(id);
    if (!week) {
      throw new ConvexError("Week not found");
    }

    await ctx.db.patch(id, {
      name,
      startDate,
      endDate,
      endDateExtraTime,
    });
    await scheduleWeekChangesInvalidation(ctx, id);
  },
});
