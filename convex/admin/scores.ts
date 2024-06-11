import { v } from "convex/values";
import { queryWithAuth } from "../withAuth";
import { getCourseRegistration } from "../courses";

export default queryWithAuth({
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

    const exercises = await db.query("exercises").collect();
    const weeks = (
      await db
        .query("weeks")
        .withIndex("by_course_and_start_date", (q) =>
          q.eq("courseId", course._id),
        )
        .collect()
    ).map((week) => ({
      id: week._id,
      name: week.name,
      exercises: exercises
        .filter((e) => e.weekId === week._id)
        .map((e) => ({
          id: e._id,
          name: e.name,
        })),
    }));

    // @TODO Update
    const users = (await db.query("users").collect()).map((user) => ({
      id: user._id,
      email: user.email,
      identifier: user.identifier,
      completedExercises: user.completedExercises,
      isAdmin: user.isAdmin,
      earlyAccess: user.earlyAccess,
    }));

    return {
      weeks,
      users: [...users],
    };
  },
});
