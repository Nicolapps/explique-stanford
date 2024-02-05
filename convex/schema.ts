import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const quizSchema = v.object({
  question: v.string(),
  answers: v.array(v.object({
    text: v.string(),
    correct: v.boolean(),
  })),
});

export default defineSchema(
  {
    attempts: defineTable({
      completed: v.boolean(),
      exerciseId: v.id("exercises"),
      userId: v.id("users"),
      threadId: v.string(),
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
      assistantId: v.string(),
      weekId: v.id("weeks"),
      text: v.optional(v.string()),
      quiz: v.optional(quizSchema),
    }),
    messages: defineTable({
      attemptId: v.id("attempts"),
      system: v.boolean(),
      content: v.string(),
      appearance: v.optional(v.literal("finished")),
    }).index("by_attempt", ["attemptId"]),

    // Lucia
    users: defineTable({
      id: v.string(), // Lucia ID
      email: v.string(),
      name: v.string(),
      accepted: v.boolean(),
      isAdmin: v.boolean(),
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
