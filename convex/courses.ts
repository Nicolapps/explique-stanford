import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { ActionCtx, DatabaseReader, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { queryWithAuth } from "./withAuth";

export const getCourseRegistrationQuery = internalQuery({
  args: {
    userId: v.id("users"),
    courseSlug: v.string(),
    role: v.optional(v.literal("admin")),
  },
  handler: async (ctx, { userId, courseSlug, role }) => {
    return await getCourseRegistration(
      ctx.db,
      { user: { _id: userId } },
      courseSlug,
      role,
    );
  },
});

export async function getCourseRegistration(
  ctx: DatabaseReader | Omit<ActionCtx, "auth">,
  session: { user: { _id: Id<"users"> } } | null,
  courseSlug: string,
  role?: "admin",
): Promise<{ course: Doc<"courses">; registration: Doc<"registrations"> }> {
  if (!session) {
    throw new ConvexError("Not logged in");
  }

  if ("runQuery" in ctx) {
    return await ctx.runQuery(internal.courses.getCourseRegistrationQuery, {
      userId: session.user._id,
      role,
      courseSlug,
    });
  }

  const db = ctx;
  const course = await db
    .query("courses")
    .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
    .first();
  if (!course) {
    throw new ConvexError("Course not found");
  }

  const registration = await db
    .query("registrations")
    .withIndex("by_user_and_course", (q) =>
      q.eq("userId", session.user._id).eq("courseId", course._id),
    )
    .first();
  if (!registration) {
    throw new ConvexError("You are not enrolled in this course.");
  }
  if (role === "admin" && registration.role !== "admin") {
    throw new ConvexError("Missing permissions.");
  }

  return { course, registration };
}

export const getRegistration = queryWithAuth({
  args: {
    courseSlug: v.string(),
  },
  handler: async (ctx, { courseSlug }) => {
    if (!ctx.session) return null;

    const { course, registration } = await getCourseRegistration(
      ctx.db,
      ctx.session,
      courseSlug,
    );

    const { name, email } = ctx.session.user;
    return {
      course: {
        name: course.name,
        code: course.code,
      },
      name,
      email,
      isAdmin: registration.role === "admin",
      group:
        registration.role === "admin" && registration.researchGroup
          ? registration.researchGroup.id
          : undefined,
    };
  },
});
