import OpenAI from "openai";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// const MODEL = "gpt-4-1106-preview"
const MODEL = "gpt-3.5-turbo-1106";

export const createAssistant = internalAction({
  args: {
    instructions: v.string(),
  },
  handler: async (ctx, { instructions }) => {},
});

export const rawInsert = internalMutation({
  args: {
    table: v.string(),
    value: v.any(),
  },
  handler: async ({ db }, { table, value }) => {
    // @ts-expect-error
    return await db.insert(table, value);
  },
});

export const seed = internalAction({
  args: {},
  handler: async ({ runMutation }, {}) => {
    // Assistant
    const openai = new OpenAI();

    const instructions =
      "Your goal is to ask the person you’re talking to to explain how bubble sort works. Do not give any advice about how it works, and ask questions to the person you’re talking to if their explanations isn’t clear enough. Once their explanation is clear enough (but not before), give the pseudo code for Bubble Sort.";
    const assistant = await openai.beta.assistants.create({
      instructions,
      model: MODEL,
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

    const insert = async (table: string, value: any) => {
      return await runMutation(internal.seed.rawInsert, { table, value });
    };

    const userId = await insert("users", {
      name: "Nicolas Ettlin",
      email: "nicolas.ettlin@me.com",
    });

    const exerciseId = await insert("exercises", {
      name: "Bubble Sort",
      instructions,
      assistantId: assistant.id,
    });

    const { id: threadId } = await openai.beta.threads.create();
    const attemptId = await insert("attempts", {
      exerciseId,
      userId,
      completed: false,
      threadId,
    });

    // False message
    await insert("messages", { attemptId, system: true, content: "Welcome!" });
  },
});

export const reset = internalMutation(async ({ db }) => {
  for (const table of ["attempts", "exercises", "messages", "users"] as const) {
    const items = await db.query(table).collect();
    for (const item of items) {
      await db.delete(item._id);
    }
  }
});
