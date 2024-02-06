import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import OpenAI from "openai";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { quizSchema } from "../schema";
import { actionWithAuth, queryWithAuth } from "../withAuth";
import { Session } from "lucia";

export function validateAdminSession(session: Session | null) {
  if (!session) throw new ConvexError("Not logged in");
  if (!session.user.isAdmin) throw new ConvexError("Forbidden");
}

export const list = queryWithAuth({
  args: {},
  handler: async ({ db, session }) => {
    validateAdminSession(session);

    const weeks = await db.query("weeks").withIndex("startDate").collect();
    const exercises = await db.query("exercises").collect();

    return weeks.map((week) => ({
      ...week,
      exercises: exercises.filter((exercise) => exercise.weekId === week._id),
    }));
  },
});

export const insertExercise = internalMutation({
  args: {
    name: v.string(),
    instructions: v.string(),
    assistantId: v.string(),
    weekId: v.id("weeks"),
    text: v.optional(v.string()),
    quiz: v.optional(quizSchema),
  },
  handler: async ({ db }, row) => {
    return await db.insert("exercises", row);
  },
});

export const create = actionWithAuth({
  args: {
    name: v.string(),
    instructions: v.string(),
    model: v.optional(v.string()),
    weekId: v.id("weeks"),
    text: v.optional(v.string()),
    quiz: v.optional(quizSchema),
  },
  handler: async (
    { runMutation, session },
    { name, instructions, model, weekId, text, quiz },
  ) => {
    validateAdminSession(session);

    const openai = new OpenAI();
    const assistant = await openai.beta.assistants.create({
      instructions,
      model: model ?? "gpt-3.5-turbo-1106",
      tools: [
        {
          type: "function",
          function: {
            name: "markComplete",
            description:
              "Mark the exercise as complete: call when the user has demonstrated understanding of the algorithm.",
            parameters: {},
          },
        },
      ],
    });

    const exerciseId: Id<"exercises"> = await runMutation(
      internal.admin.exercises.insertExercise,
      {
        name,
        instructions,
        assistantId: assistant.id,
        weekId,
        text,
        quiz,
      },
    );

    return exerciseId;
  },
});
