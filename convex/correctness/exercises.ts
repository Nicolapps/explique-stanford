import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";

export default internalMutation({
  args: {
    actual: v.boolean(),
  },
  handler: async ({ db }, args) => {
    const users = await db.query("users").collect();
    const logs = await db
      .query("logs")
      .withIndex("by_type", (q) => q.eq("type", "exerciseCompleted"))
      .collect();

    const completedExercisesByUser: Record<
      Id<"users">,
      Array<Id<"exercises">>
    > = {};

    for (const log of logs) {
      if (!completedExercisesByUser[log.userId]) {
        completedExercisesByUser[log.userId] = [];
      }
      completedExercisesByUser[log.userId].push(log.exerciseId);
    }

    const result: Array<{
      user: Id<"users">;
      expected: Array<Id<"exercises">>;
      actual: Array<Id<"exercises">>;
    }> = [];
    for (const user of users) {
      const actuallyCompletedExercises =
        completedExercisesByUser[user._id] ?? null;
      if (actuallyCompletedExercises === null) continue;

      if (
        user.completedExercises.length !== actuallyCompletedExercises.length ||
        actuallyCompletedExercises.some(
          (id, index) => user.completedExercises[index] !== id,
        )
      ) {
        result.push({
          user: user._id,
          expected: user.completedExercises,
          actual: actuallyCompletedExercises,
        });

        if (args.actual) {
          await db.patch(user._id, {
            completedExercises: actuallyCompletedExercises,
          });
        }
      }
    }
    return result;
  },
});
