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
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const user = ctx.session?.user;
    if (!user) throw new ConvexError("Not logged in");

    const isCorrect = code === "ALGO-1234";
    if (isCorrect) {
      ctx.db.patch(user._id, { researchConsent: true });
    }
    return { isCorrect };
  },
});
