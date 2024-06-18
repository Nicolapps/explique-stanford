import { ConvexError, v } from "convex/values";
import { mutationWithAuth, queryWithAuth } from "../auth/withAuth";
import { getCourseRegistration } from "../courses";
import slugify from "@sindresorhus/slugify";

export const get = queryWithAuth({
  args: {
    courseSlug: v.string(),
  },
  handler: async ({ db, session }, { courseSlug }) => {
    const { course } = await getCourseRegistration(
      db,
      session,
      courseSlug,
      "admin",
    );

    return {
      name: course.name,
      code: course.code,
    };
  },
});

export const edit = mutationWithAuth({
  args: {
    courseSlug: v.string(),
    name: v.string(),
    code: v.string(),
  },
  handler: async ({ db, session }, { courseSlug, name, code }) => {
    const { course } = await getCourseRegistration(
      db,
      session,
      courseSlug,
      "admin",
    );

    if (!/^[A-Za-z0-9\(\)-_]+$/.test(code)) {
      throw new ConvexError("Invalid course code.");
    }

    const slug = slugify(code, {
      separator: "",
    });

    // Verify that the name is available
    const existingCourse = await db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .filter((q) => q.not(q.eq(q.field("_id"), course._id)))
      .first();
    if (existingCourse) {
      throw new Error("This course code is already used by another course.");
    }

    await db.patch(course._id, { name, code, slug });

    return { slug };
  },
});
