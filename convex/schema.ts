import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const quizNewSchema = v.object({
  batches: v.array(
    v.object({
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
  ),
});

export const quizSchema = v.union(
  quizNewSchema,

  // @TODO Remove (Deprecated)
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

      // Overwrite this value to ensure that queries depending on start/end dates
      // are invalidated.
      cacheInvalidation: v.optional(v.number()),
    }).index("startDate", ["startDate"]),
    exercises: defineTable({
      name: v.string(),
      instructions: v.string(),
      model: v.string(),
      assistantId: v.string(),
      weekId: v.id("weeks"),
      text: v.string(),
      quiz: quizSchema,
      firstMessage: v.optional(v.string()),
      controlGroup: v.union(v.literal("A"), v.literal("B")),
      completionFunctionDescription: v.string(),
      image: v.optional(v.union(v.string(), v.id("images"))),
      imagePrompt: v.optional(v.string()),
    }),
    images: defineTable({
      original: v.string(),
      thumbnails: v.array(
        v.object({
          type: v.string(),
          srcset: v.string(),
          storageId: v.id("_storage"),
          sizes: v.optional(v.string()),
        }),
      ),
      model: v.string(),
      size: v.string(),
      quality: v.union(v.literal("standard"), v.literal("hd")),
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

    groupAssignments: defineTable({
      email: v.string(),
      group: v.union(v.literal("A"), v.literal("B")),
      researchConsent: v.optional(v.literal(true)),
    }).index("byEmail", ["email"]),

    // Lucia
    users: defineTable({
      id: v.string(), // Lucia ID
      email: v.string(),
      name: v.string(),
      isAdmin: v.boolean(),
      earlyAccess: v.optional(v.literal(true)),
      researchConsent: v.optional(v.literal(true)),
      group: v.union(v.literal("A"), v.literal("B")),
      extraTime: v.optional(v.literal(true)),
    })
      .index("byId", ["id"])
      .index("byEmail", ["email"]),

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
