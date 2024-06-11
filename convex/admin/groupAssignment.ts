import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import Chance from "chance";
import { queryWithAuth } from "../withAuth";
import { Doc } from "../_generated/dataModel";
import { getCourseRegistration } from "../courses";

export const importAndAssign = internalMutation({
  args: {
    identifiers: v.string(),
  },
  handler: async (ctx, args) => {
    const existingIdentifiers = new Set(
      (await ctx.db.query("groupAssignments").collect())
        .filter((a) => a.identifier)
        .map((a) => a.identifier),
    );

    let identifiers = args.identifiers
      .split(",")
      .filter((e) => !existingIdentifiers.has(e));

    const chance = new Chance();
    identifiers = chance.shuffle(identifiers);

    for (let i = 0; i < identifiers.length; i++) {
      await ctx.db.insert("groupAssignments", {
        identifier: identifiers[i],
        group: i % 2 === 0 ? "A" : "B",
      });
    }

    console.log("Successfully imported " + identifiers.length + " students");
  },
});

export const assignNumbers = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const group of ["A", "B"] as const) {
      const usersInGroup = await ctx.db
        .query("groupAssignments")
        .withIndex("byGroup", (q) => q.eq("group", group))
        .collect();

      let i = 0;
      for (const user of usersInGroup) {
        await ctx.db.patch(user._id, {
          positionInGroup: i,
          groupLength: usersInGroup.length,
        });
        i++;
      }
    }
  },
});

export const stats = queryWithAuth({
  args: {
    courseSlug: v.string(),
  },
  handler: async ({ db, session }, { courseSlug }) => {
    await getCourseRegistration(db, session, courseSlug, "admin");

    const assignments = await db.query("groupAssignments").collect();
    const assignmentAsMap = new Map<string, "A" | "B">(
      assignments.map((a) => [a.identifier, a.group]),
    );

    const users = await db.query("users").collect();

    const mapTable = ({
      _id,
      group,
      identifier,
      isAdmin,
      earlyAccess,
    }: Doc<"users">) => ({ id: _id, group, identifier, isAdmin, earlyAccess });

    async function isGroupValid(group: "A" | "B") {
      const peopleInGroups = assignments.filter((u) => u.group === group);

      return peopleInGroups.every(
        (p, i) =>
          p.groupLength === peopleInGroups.length && p.positionInGroup === i,
      );
    }

    return {
      numbersValid: (await isGroupValid("A")) && (await isGroupValid("B")),
      evenlyAssigned: {
        A: assignments.filter((u) => u.group === "A").length,
        B: assignments.filter((u) => u.group === "B").length,
        total: assignments.length,
      },
      randomAssigned: users
        .filter(
          (user) =>
            user.identifier === undefined ||
            !assignmentAsMap.has(user.identifier),
        )
        .map(mapTable),
      assignmentChanged: users
        .filter(
          (user) =>
            user.identifier !== undefined &&
            assignmentAsMap.has(user.identifier) &&
            assignmentAsMap.get(user.identifier) !== user.group,
        )
        .map(mapTable),
    };
  },
});

export const fixNonMatchingAssigments = internalMutation({
  args: {},
  handler: async ({ db }, {}) => {
    const assignments = await db.query("groupAssignments").collect();
    const assignmentAsMap = new Map<string, "A" | "B">(
      assignments.map((a) => [a.identifier, a.group]),
    );
    const users = await db.query("users").collect();

    const nonMatchingAssignments = users.filter(
      (user) =>
        user.identifier !== undefined &&
        assignmentAsMap.has(user.identifier) &&
        assignmentAsMap.get(user.identifier) !== user.group,
    );

    for (const user of nonMatchingAssignments) {
      await db.patch(user._id, {
        group: assignmentAsMap.get(user.identifier!)!,
      });
    }
  },
});
