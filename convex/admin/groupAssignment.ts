import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import Chance from "chance";
import { queryWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";
import { Doc } from "../_generated/dataModel";

export const importAndAssign = internalMutation({
  args: {
    emails: v.string(),
  },
  handler: async (ctx, args) => {
    const existingEmails = new Set(
      (await ctx.db.query("groupAssignments").collect()).map((a) => a.email),
    );

    let emails = args.emails.split(",").filter((e) => !existingEmails.has(e));

    const chance = new Chance();
    emails = chance.shuffle(emails);

    for (let i = 0; i < emails.length; i++) {
      await ctx.db.insert("groupAssignments", {
        email: emails[i],
        group: i % 2 === 0 ? "A" : "B",
      });
    }

    console.log("Successfully imported " + emails.length + " emails");
  },
});

export const stats = queryWithAuth({
  args: {},
  handler: async ({ db, session }) => {
    validateAdminSession(session);

    const assignments = await db.query("groupAssignments").collect();
    const assignmentAsMap = new Map<string, string>(
      assignments.map((a) => [a.email, a.group]),
    );

    const users = await db.query("users").collect();

    const mapTable = ({
      group,
      email,
      isAdmin,
      earlyAccess,
    }: Doc<"users">) => ({ group, email, isAdmin, earlyAccess });

    return {
      evenlyAssigned: {
        A: assignments.filter((u) => u.group === "A").length,
        B: assignments.filter((u) => u.group === "B").length,
        total: assignments.length,
      },
      randomAssigned: users
        .filter((user) => !assignmentAsMap.has(user.email))
        .map(mapTable),
      assignmentChanged: users
        .filter(
          (user) =>
            assignmentAsMap.has(user.email) &&
            assignmentAsMap.get(user.email) !== user.group,
        )
        .map(mapTable),
    };
  },
});
