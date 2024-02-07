import { ConvexError, v } from "convex/values";
import { mutationWithAuth, queryWithAuth } from "./withAuth";

export const hasBeenSet = queryWithAuth({
  args: {},
  handler: async (ctx) => {
    if (!ctx.session) throw new ConvexError("Not logged in");
    return typeof ctx.session.user.researchConsent === "boolean";
  },
});

export const set = mutationWithAuth({
  args: {
    value: v.boolean(),
  },
  handler: async (ctx, { value }) => {
    const user = ctx.session?.user;
    if (!user) throw new ConvexError("Not logged in");

    ctx.db.patch(user._id, { researchConsent: value });
  },
});
