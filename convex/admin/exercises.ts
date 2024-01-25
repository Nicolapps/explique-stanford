import { v } from "convex/values";
import { internalAction, internalMutation, query } from "../_generated/server";
import OpenAI from "openai";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const list = query(async (ctx) => {
  return await ctx.db.query("exercises").collect();
});

export const insertExercise = internalMutation({
  args: {
    name: v.string(),
    instructions: v.string(),
    assistantId: v.string(),
  },
  handler: async ({ db }, row) => {
    return await db.insert("exercises", row);
  },
});

export const create = internalAction({
  args: {
    name: v.string(),
    instructions: v.string(),
    model: v.optional(v.string()),
  },
  handler: async ({ runMutation }, { name, instructions, model }) => {
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
      },
    );

    return exerciseId;
  },
});
