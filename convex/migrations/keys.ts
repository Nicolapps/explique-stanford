import { internalMutation } from "../_generated/server";

export default internalMutation(async ({ db }) => {
  const users = await db.query("users").collect();
  for (const user of users) {
    if (!user.identifier) {
      console.warn("User does not have an identifier", user);
      continue;
    }

    const id = `tequila:${user.identifier}`;
    const currentIdentifier = await db
      .query("users")
      .withIndex("byId", (q) => q.eq("id", id))
      .first();

    if (!currentIdentifier) {
      await db.insert("auth_keys", {
        user_id: user.id,
        id,
        hashed_password: null,
      });
    }
  }
});
