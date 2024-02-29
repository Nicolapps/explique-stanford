import { ConvexError, v } from "convex/values";
import { queryWithAuth } from "./withAuth";
import { Id } from "./_generated/dataModel";
import { action, internalQuery } from "./_generated/server";
import { getAuth, getEpflAuth, getGoogleAuth } from "./lucia";
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
  args: {
    external: v.optional(v.literal(true)),
  },
  async handler(ctx, { external }) {
    const auth = external
      ? getGoogleAuth(actionAuthDbWriter(ctx))
      : getEpflAuth(actionAuthDbWriter(ctx));

    const [url] = await auth.getAuthorizationUrl();
    return url.toString();
  },
});

export const getCreationInformationForUser = internalQuery({
  args: {
    email: v.string(),
    seed: v.number(),
  },
  handler: async (ctx, { email }) => {
    const existingAssignment = await ctx.db
      .query("groupAssignments")
      .withIndex("byEmail", (q) => q.eq("email", email))
      .first();

    const group = existingAssignment
      ? existingAssignment.group
      : Math.random() > 0.5
        ? "A"
        : "B";

    const researchConsent = existingAssignment?.researchConsent ?? false;

    return { group, researchConsent };
  },
});

export const redirect = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const auth = getAuth(actionAuthDbWriter(ctx));
    const googleAuth = getEpflAuth(actionAuthDbWriter(ctx));

    try {
      const { getExistingUser, googleUser, createUser } =
        await googleAuth.validateCallback(code);

      const getUser = async () => {
        const existingUser = await getExistingUser();
        if (existingUser) return existingUser;

        const email = googleUser.email;
        if (!email) throw new ConvexError("Can’t retrieve your email address");

        const { group, researchConsent } = await ctx.runQuery(
          internal.auth.getCreationInformationForUser,
          {
            email,
            seed: Math.random(),
          },
        );

        const user = await createUser({
          attributes: {
            name: googleUser.name,
            email,
            isAdmin: false,
            group,
            researchConsent: researchConsent ? true : undefined,
            completedExercises: [],

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
