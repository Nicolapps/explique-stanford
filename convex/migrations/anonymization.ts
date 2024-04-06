import { ConvexError } from "convex/values";
import { internalMutation } from "../_generated/server";

export default internalMutation(async (ctx) => {
  let changed = 0;
  for (const user of await ctx.db.query("users").collect()) {
    if (user.email && user.email.endsWith("@epfl.ch")) {
      if (!user.identifier) {
        throw new ConvexError("User " + user.email + " has no identifier");
      }

      await ctx.db.patch(user._id, {
        email: null,
        name: null,
      });
    }
  }
  return { changed };
});
