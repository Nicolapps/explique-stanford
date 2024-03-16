import { internalMutation } from "../_generated/server";

export default internalMutation(async ({ db }) => {
  const users = await db.query("users").collect();
  for (const user of users) {
    if (!user.identifier) {
      console.warn("User does not have an identifier", user);
      continue;
    }

    await db.insert("auth_keys", {
      user_id: user.id,
      id: `tequila:${user.identifier}`,
      hashed_password: null,
    });
  }
});
