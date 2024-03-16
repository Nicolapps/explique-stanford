import { internalMutation } from "../_generated/server";
import { getIdentifier } from "../../src/util/crypto";

export const migrateUsers = internalMutation({
  handler: async ({ db }) => {
    const rows = await db.query("users").collect();

    for (const row of rows) {
      await db.patch(row._id, {
        identifier: getIdentifier(row.email),
      });
    }
  },
});

export const migrateGroupAssignments = internalMutation({
  handler: async ({ db }) => {
    const rows = await db.query("groupAssignments").collect();

    for (const row of rows) {
      await db.patch(row._id, {
        identifier: getIdentifier(row.email),
      });
    }
  },
});
