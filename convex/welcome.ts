import { mutationWithAuth, queryWithAuth } from "./withAuth";

export default queryWithAuth({
  args: {},
  handler: async (ctx) => {
    return ctx.session?.user.accepted ?? true;
  },
});

export const accept = mutationWithAuth({
  args: {},
  handler: async (ctx) => {
    const user = ctx.session?.user;
    if (!user) throw new Error("No user in session");

    ctx.db.patch(user._id, { accepted: true });
  },
});
