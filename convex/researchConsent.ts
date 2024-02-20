import { ConvexError } from "convex/values";
import { queryWithAuth } from "./withAuth";

export const hasBeenSet = queryWithAuth({
  args: {},
  handler: async (ctx) => {
    if (!ctx.session) throw new ConvexError("Not logged in");
    return typeof ctx.session.user.researchConsent === "boolean";
  },
});
