import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const quizSchema = v.union(
  // Deprecated
  v.object({
    question: v.string(),
    answers: v.array(
      v.object({
        text: v.string(),
        correct: v.boolean(),
      }),
    ),
  }),

  v.object({
    shownQuestionsCount: v.number(),
    questions: v.array(
      v.object({
        question: v.string(),
        answers: v.array(
          v.object({
            text: v.string(),
            correct: v.boolean(),
          }),
        ),
      }),
    ),
  }),
);

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
      lastQuizSubmission: v.optional(v.number()), // @TODO Deprecate
    }).index("by_key", ["userId", "exerciseId"]),
    quizSubmissions: defineTable({
      attemptId: v.id("attempts"),
      answers: v.array(v.number()),
    }).index("attemptId", ["attemptId"]),
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
      completionFunctionDescription: v.string(),
      image: v.optional(v.string()),
      imagePrompt: v.optional(v.string()),
    }),
    messages: defineTable({
      attemptId: v.id("attempts"),
      system: v.boolean(),
      content: v.string(),
      appearance: v.optional(
        v.union(v.literal("finished"), v.literal("typing"), v.literal("error")),
      ),
    }).index("by_attempt", ["attemptId"]),
    logs: defineTable({
      type: v.union(
        v.literal("exerciseCompleted"),
        v.literal("quizStarted"),
        v.literal("quizSubmission"),
      ),
      userId: v.id("users"),
      attemptId: v.id("attempts"),
      exerciseId: v.id("exercises"),
      variant: v.union(v.literal("reading"), v.literal("explain")),
      details: v.optional(v.any()),
    }),

    // Lucia
    users: defineTable({
      id: v.string(), // Lucia ID
      email: v.string(),
      name: v.string(),
      isAdmin: v.boolean(),
      earlyAccess: v.optional(v.literal(true)),
      researchConsent: v.optional(v.boolean()),
      group: v.union(v.literal("A"), v.literal("B")),
      extraTime: v.optional(v.literal(true)),
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
