import { ConvexError, v } from "convex/values";
import { queryWithAuth } from "./withAuth";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { getAuth, getGoogleAuth } from "./lucia";
import { actionAuthDbWriter } from "./authDbWriter";
import { OAuthRequestError } from "@lucia-auth/oauth";

export const get = queryWithAuth({
  args: {},
  handler: async (ctx) => {
    return ctx.session?.user;
  },
});

export const getLoginUrl = action({
  async handler(ctx) {
    const googleAuth = getGoogleAuth(actionAuthDbWriter(ctx));

    const [url] = await googleAuth.getAuthorizationUrl();
    return url.toString();
  },
});

export const redirect = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const auth = getAuth(actionAuthDbWriter(ctx));
    const googleAuth = getGoogleAuth(actionAuthDbWriter(ctx));

    try {
      const { getExistingUser, googleUser, createUser } =
        await googleAuth.validateCallback(code);

      const getUser = async () => {
        const existingUser = await getExistingUser();
        if (existingUser) return existingUser;

        const user = await createUser({
          attributes: {
            name: googleUser.name,
            email: googleUser.email ?? "",
            isAdmin: false,
            accepted: false,

            // These will be filled out by Convex
            _id: "" as Id<"users">,
            _creationTime: 0,
          },
        });
        return user;
      };

      const user = await getUser();
      const session = await auth.createSession({
        userId: user.userId,
        attributes: {
          // These will be filled out by Convex
          _id: "" as Id<"sessions">,
          _creationTime: 0,
        },
      });

      return session.sessionId;
    } catch (e) {
      if (e instanceof OAuthRequestError) {
        throw new ConvexError("Invalid code " + code);
      }
      throw e;
    }
  },
});
