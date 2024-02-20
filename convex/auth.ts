import { ConvexError, v } from "convex/values";
import { queryWithAuth } from "./withAuth";
import { Id } from "./_generated/dataModel";
import { action, internalQuery } from "./_generated/server";
import { getAuth, getGoogleAuth } from "./lucia";
import { actionAuthDbWriter } from "./authDbWriter";
import { OAuthRequestError } from "@lucia-auth/oauth";
import { internal } from "./_generated/api";

export const get = queryWithAuth({
  args: {},
  handler: async (ctx) => {
    if (!ctx.session) return null;

    const { name, email, isAdmin, group, researchConsent } = ctx.session.user;
    return {
      name,
      email,
      isAdmin,
      group: isAdmin ? group : undefined,
      researchConsent,
    };
  },
});

export const getLoginUrl = action({
  async handler(ctx) {
    const googleAuth = getGoogleAuth(actionAuthDbWriter(ctx));

    const [url] = await googleAuth.getAuthorizationUrl();
    return url.toString();
  },
});

export const getGroupForUser = internalQuery({
  args: {
    email: v.string(),
    seed: v.number(),
  },
  handler: async (ctx, { email }) => {
    const existingAssignment = await ctx.db
      .query("groupAssignments")
      .withIndex("byEmail", (q) => q.eq("email", email))
      .first();

    if (existingAssignment) return existingAssignment.group;
    return Math.random() > 0.5 ? "A" : "B";
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

        const email = googleUser.email;
        if (!email) throw new ConvexError("Can’t retrieve your email address");

        const group = await ctx.runQuery(internal.auth.getGroupForUser, {
          email,
          seed: Math.random(),
        });

        const user = await createUser({
          attributes: {
            name: googleUser.name,
            email,
            isAdmin: false,
            group,

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
