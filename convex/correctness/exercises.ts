import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";

export default internalMutation({
  args: {
    actual: v.boolean(),
  },
  handler: async ({ db }, args) => {
    const users = await db.query("users").collect();
    const successes = await db
      .query("attempts")
      .withIndex("by_status", (q) => q.eq("status", "quizCompleted"))
      .collect();

    const completedExercisesByUser: Record<
      Id<"users">,
      Array<Id<"exercises">>
    > = {};

    for (const success of successes) {
      if (!completedExercisesByUser[success.userId]) {
        completedExercisesByUser[success.userId] = [];
      }

      if (
        !completedExercisesByUser[success.userId].includes(success.exerciseId)
      ) {
        completedExercisesByUser[success.userId].push(success.exerciseId);
      }
    }

    const result: Array<{
      identifier: string | undefined;
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
          identifier: user.identifier,
          expected: actuallyCompletedExercises,
          actual: user.completedExercises,
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
