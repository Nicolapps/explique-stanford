import { v } from "convex/values";
import { mutationWithAuth, queryWithAuth } from "../auth/withAuth";
import { getCourseRegistration } from "../courses";

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

