import { ConvexError, v } from "convex/values";
import { mutationWithAuth } from "../withAuth";

export default mutationWithAuth({
  args: {
    identifiers: v.array(v.string()),
  },
  handler: async (ctx, { identifiers }) => {
    let added = 0;
    const notInGroups: string[] = [];
    for (const identifier of identifiers) {
      const groupAssignment = await ctx.db
        .query("groupAssignments")
        .withIndex("byIdentifier", (q) => q.eq("identifier", identifier))
        .first();
      if (groupAssignment) {
        await ctx.db.patch(groupAssignment._id, { researchConsent: true });
      } else {
        notInGroups.push(identifier);
      }

      const user = await ctx.db
        .query("users")
        .withIndex("byIdentifier", (q) => q.eq("identifier", identifier))
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
