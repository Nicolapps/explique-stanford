import { queryWithAuth } from "../withAuth";
import { validateAdminSession } from "./exercises";

export default queryWithAuth({
  args: {},
  handler: async ({ db, session }, {}) => {
    validateAdminSession(session);

    const exercises = await db.query("exercises").collect();
    const weeks = (
      await db.query("weeks").withIndex("startDate").collect()
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

    const users = (await db.query("users").withIndex("byEmail").collect()).map(
      (user) => ({
        email: user.email,
        completedExercises: user.completedExercises,
        isAdmin: user.isAdmin,
        earlyAccess: user.earlyAccess,
      }),
    );

    return {
      weeks,
      exercises,
      users: [...users],
    };
  },
});
