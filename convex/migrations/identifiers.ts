import { internalMutation } from "../_generated/server";
import { getIdentifier } from "../../src/util/crypto";

export const migrateUsers = internalMutation({
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("identifier"), undefined))
      .collect();

    for (const row of rows) {
      await ctx.db.patch(row._id, {
        identifier: getIdentifier(row.email),
      });
    }
  },
});
