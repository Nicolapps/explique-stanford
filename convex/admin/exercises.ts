import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import OpenAI from "openai";
import { internal } from "../_generated/api";
import { quizSchema } from "../schema";
import { actionWithAuth, queryWithAuth } from "../withAuth";
import { Session } from "lucia";

export function validateAdminSession(session: Session | null) {
  if (!session) throw new ConvexError("Not logged in");
  if (!session.user.isAdmin) throw new ConvexError("Forbidden");
}

export const get = queryWithAuth({
  args: {
    id: v.id("exercises"),
  },
  handler: async ({ db, session }, { id }) => {
    validateAdminSession(session);

    const exercise = await db.get(id);
    if (!exercise) {
      return null;
    }

    const quiz = exercise.quiz;

    return {
      ...exercise,
      quiz,
    };
  },
});

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

export const insertRow = internalMutation({
  args: {
    name: v.string(),
    image: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    instructions: v.string(),
    assistantId: v.string(),
    weekId: v.id("weeks"),
    text: v.string(),
    quiz: quizSchema,
    model: v.string(),
    firstMessage: v.string(),
    controlGroup: v.union(v.literal("A"), v.literal("B")),
    completionFunctionDescription: v.string(),
  },
  handler: async ({ db }, row) => {
    return await db.insert("exercises", row);
  },
});

export const updateRow = internalMutation({
  args: {
    id: v.id("exercises"),
    row: v.object({
      name: v.string(),
      image: v.optional(v.string()),
      imagePrompt: v.optional(v.string()),
      instructions: v.string(),
      assistantId: v.string(),
      weekId: v.id("weeks"),
      text: v.string(),
      quiz: quizSchema,
      model: v.string(),
      firstMessage: v.string(),
      controlGroup: v.union(v.literal("A"), v.literal("B")),
      completionFunctionDescription: v.string(),
    }),
  },
  handler: async ({ db }, { id, row }) => {
    return await db.replace(id, row);
  },
});

async function createAssistant(
  instructions: string,
  model: string,
  completionFunctionDescription: string,
) {
  const openai = new OpenAI();
  return await openai.beta.assistants.create({
    instructions,
    model: model,
    tools: [
      {
        type: "function",
        function: {
          name: "markComplete",
          description: completionFunctionDescription,
          parameters: {},
        },
      },
    ],
  });
}

export const create = actionWithAuth({
  args: {
    name: v.string(),
    image: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    instructions: v.string(),
    model: v.string(),
    weekId: v.id("weeks"),
    text: v.string(),
    quiz: quizSchema,
    firstMessage: v.string(),
    controlGroup: v.union(v.literal("A"), v.literal("B")),
    completionFunctionDescription: v.string(),
  },
  handler: async (
    { runMutation, session },
    {
      name,
      image,
      imagePrompt,
      instructions,
      model,
      weekId,
      text,
      quiz,
      firstMessage,
      controlGroup,
      completionFunctionDescription,
    },
  ) => {
    validateAdminSession(session);

    const assistant = await createAssistant(
      instructions,
      model,
      completionFunctionDescription,
    );

    await runMutation(internal.admin.exercises.insertRow, {
      name,
      image,
      imagePrompt,
      instructions,
      assistantId: assistant.id,
      weekId,
      text,
      quiz,
      model,
      firstMessage,
      controlGroup,
      completionFunctionDescription,
    });
  },
});

export const update = actionWithAuth({
  args: {
    id: v.id("exercises"),
    image: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    name: v.string(),
    instructions: v.string(),
    model: v.string(),
    weekId: v.id("weeks"),
    text: v.string(),
    quiz: quizSchema,
    firstMessage: v.string(),
    controlGroup: v.union(v.literal("A"), v.literal("B")),
    completionFunctionDescription: v.string(),
  },
  handler: async (
    { runMutation, session },
    {
      id,
      name,
      image,
      imagePrompt,
      instructions,
      model,
      weekId,
      text,
      quiz,
      firstMessage,
      controlGroup,
      completionFunctionDescription,
    },
  ) => {
    validateAdminSession(session);

    const assistant = await createAssistant(
      instructions,
      model,
      completionFunctionDescription,
    );

    await runMutation(internal.admin.exercises.updateRow, {
      id,
      row: {
        name,
        image,
        imagePrompt,
        instructions,
        assistantId: assistant.id,
        weekId,
        text,
        quiz,
        model,
        firstMessage,
        controlGroup,
        completionFunctionDescription,
      },
    });
  },
});
