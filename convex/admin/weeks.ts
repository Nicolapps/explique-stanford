import { v } from "convex/values";
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
