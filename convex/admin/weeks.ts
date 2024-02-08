import { ConvexError, v } from "convex/values";
import { mutationWithAuth, queryWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";

export const getName = queryWithAuth({
  args: {
    weekId: v.id("weeks"),
  },
  handler: async ({ db, session }, { weekId }) => {
    validateAdminSession(session);

    return (await db.get(weekId))?.name;
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

export const create = mutationWithAuth({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    endDateExtraTime: v.number(),
  },
  handler: async (
    { db, session },
    { name, startDate, endDate, endDateExtraTime },
  ) => {
    validateAdminSession(session);

    await db.insert("weeks", {
      name,
      startDate,
      endDate,
      endDateExtraTime,
    });
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
  handler: async (
    { db, session },
    { id, name, startDate, endDate, endDateExtraTime },
  ) => {
    validateAdminSession(session);

    const week = await db.get(id);
    if (!week) {
      throw new ConvexError("Week not found");
    }

    await db.patch(id, {
      name,
      startDate,
      endDate,
      endDateExtraTime,
    });
  },
});
