import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const quizSchema = v.object({
  question: v.string(),
  answers: v.array(
    v.object({
      text: v.string(),
      correct: v.boolean(),
    }),
  ),
});

export default defineSchema(
  {
    attempts: defineTable({
      status: v.union(
        v.literal("exercise"),
        v.literal("exerciseCompleted"),
        v.literal("quiz"),
        v.literal("quizCompleted"),
      ),
      exerciseId: v.id("exercises"),
      userId: v.id("users"),
      threadId: v.union(v.string(), v.null()), // null: reading variant, otherwise: explain variant
      lastQuizSubmission: v.optional(v.number()),
    }).index("by_key", ["userId", "exerciseId"]),
    weeks: defineTable({
      name: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      endDateExtraTime: v.number(),
    }).index("startDate", ["startDate"]),
    exercises: defineTable({
      name: v.string(),
      instructions: v.string(),
      model: v.optional(v.string()),
      assistantId: v.string(),
      weekId: v.id("weeks"),
      text: v.string(),
      quiz: quizSchema,
      firstMessage: v.optional(v.string()),
      controlGroup: v.union(v.literal("A"), v.literal("B")),
    }),
    messages: defineTable({
      attemptId: v.id("attempts"),
      system: v.boolean(),
      content: v.string(),
      appearance: v.optional(
        v.union(v.literal("finished"), v.literal("typing"), v.literal("error")),
      ),
    }).index("by_attempt", ["attemptId"]),

    // Lucia
    users: defineTable({
      id: v.string(), // Lucia ID
      email: v.string(),
      name: v.string(),
      isAdmin: v.boolean(),
      accepted: v.optional(v.boolean()),
      researchConsent: v.optional(v.boolean()),
      group: v.union(v.literal("A"), v.literal("B")),
    }).index("byId", ["id"]),
    sessions: defineTable({
      id: v.string(),
      user_id: v.string(),
      active_expires: v.float64(),
      idle_expires: v.float64(),
    })
      .index("byId", ["id"])
      .index("byUserId", ["user_id"]),
    auth_keys: defineTable({
      id: v.string(),
      hashed_password: v.union(v.string(), v.null()),
      user_id: v.string(),
    })
      .index("byId", ["id"])
      .index("byUserId", ["user_id"]),
  },
  {
    schemaValidation: true,
  },
);
