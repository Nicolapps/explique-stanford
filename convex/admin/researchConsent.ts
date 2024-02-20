import { ConvexError, v } from "convex/values";
import { mutationWithAuth } from "../withAuth";

export default mutationWithAuth({
  args: {
    emails: v.string(),
  },
  handler: async (ctx, { emails }) => {
    const validatedEmails = emails
      .split(",")
      .map((l) => l.trim())
      .filter((email) => !!email);

    const invalidEmail = validatedEmails.find((e) => !e.endsWith("@epfl.ch"));
    if (invalidEmail) {
      throw new ConvexError("Invalid email: " + invalidEmail);
    }

    let added = 0;
    const notInGroups: string[] = [];
    for (const email of validatedEmails) {
      const groupAssignment = await ctx.db
        .query("groupAssignments")
        .withIndex("byEmail", (q) => q.eq("email", email))
        .first();
      if (groupAssignment) {
        await ctx.db.patch(groupAssignment._id, { researchConsent: true });
      } else {
        notInGroups.push(email);
      }

      const user = await ctx.db
        .query("users")
        .withIndex("byEmail", (q) => q.eq("email", email))
        .first();
      if (user) {
        await ctx.db.patch(user._id, { researchConsent: true });
      }

      if (
        (groupAssignment && !groupAssignment.researchConsent) ||
        (user && !user.researchConsent)
      ) {
        added += 1;
      }
    }

    return {
      added,
      notInGroups,
    };
  },
});
