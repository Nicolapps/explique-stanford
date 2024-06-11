import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { DatabaseReader } from "./_generated/server";

export async function getCourseRegistration(
  db: DatabaseReader,
  session: { user: { _id: Id<"users"> } } | null,
  courseSlug: string,
  role?: "admin",
): Promise<{ course: Doc<"courses">; registration: Doc<"registrations"> }> {
  if (!session) {
    throw new ConvexError("Not logged in");
  }

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
