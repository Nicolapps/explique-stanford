import { ConvexError, v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import OpenAI from "openai";
import { internal } from "../_generated/api";
import { exerciseAdminSchema } from "../schema";
import { actionWithAuth, queryWithAuth } from "../withAuth";
import { Session } from "lucia";
import { COMPLETION_VALID_MODELS } from "../chat";
import { getCourseRegistration } from "../courses";

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

    return exercise;
  },
});

export const list = queryWithAuth({
  args: {
    courseSlug: v.string(),
  },
  handler: async ({ db, session }, { courseSlug }) => {
    const { course } = await getCourseRegistration(
      db,
      session,
      courseSlug,
      "admin",
    );

    const weeks = await db
      .query("weeks")
      .withIndex("by_course_and_start_date", (q) =>
        q.eq("courseId", course._id),
      )
      .collect();
    const exercises = await db.query("exercises").collect();

    return weeks.map((week) => ({
      ...week,
      exercises: exercises.filter((exercise) => exercise.weekId === week._id),
    }));
  },
});

export const insertRow = internalMutation({
  args: { ...exerciseAdminSchema, assistantId: v.string() },
  handler: async ({ db }, row) => {
    return await db.insert("exercises", row);
  },
});

export const updateRow = internalMutation({
  args: {
    id: v.id("exercises"),
    row: v.object({
      ...exerciseAdminSchema,
      assistantId: v.string(),
    }),
  },
  handler: async ({ db }, { id, row }) => {
    // Verify that the course isn’t changed
    const existing = await db.get(id);
    if (!existing) {
      throw new ConvexError("Exercise not found");
    }

    // Verify that the exercise stays in the same course
    const oldWeek = await db.get(existing.weekId);
    const newWeek = await db.get(row.weekId);
    if (!oldWeek || !newWeek || newWeek.courseId !== oldWeek.courseId) {
      throw new ConvexError("The course of an exercise cannot be changed");
    }

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

export const createInternal = internalAction({
  args: exerciseAdminSchema,
  handler: async ({ runMutation }, row) => {
    validateQuiz(row.quiz);
    if (
      row.chatCompletionsApi &&
      !COMPLETION_VALID_MODELS.includes(row.model as any)
    ) {
      throw new ConvexError(
        `The model ${row.model} is not supported by the Chat Completions API.`,
      );
    }

    const assistant = await createAssistant(
      row.instructions,
      row.model,
      row.completionFunctionDescription,
    );

    await runMutation(internal.admin.exercises.insertRow, {
      ...{ ...row, sessionId: undefined },
      assistantId: assistant.id,
    });
  },
});

export const create = actionWithAuth({
  args: exerciseAdminSchema,
  handler: async ({ runAction, session }, row) => {
    validateAdminSession(session);

    // @TODO Validate the week ID

    runAction(internal.admin.exercises.createInternal, row);
  },
});

export const update = actionWithAuth({
  args: {
    id: v.id("exercises"),
    ...exerciseAdminSchema,
  },
  handler: async ({ runMutation, session }, { id, ...row }) => {
    validateAdminSession(session);
    validateQuiz(row.quiz);

    // @TODO Validate the week ID

    if (
      row.chatCompletionsApi &&
      !COMPLETION_VALID_MODELS.includes(row.model as any)
    ) {
      throw new ConvexError(
        `The model ${row.model} is not supported by the Chat Completions API.`,
      );
    }

    const assistant = await createAssistant(
      row.instructions,
      row.model,
      row.completionFunctionDescription,
    );

    await runMutation(internal.admin.exercises.updateRow, {
      id,
      row: {
        ...{
          ...row,
          sessionId: undefined,
        },
        assistantId: assistant.id,
      },
    });
  },
});

type Quiz = null | {
  batches: {
    questions: {
      answers: {
        text: string;
        correct: boolean;
      }[];
      question: string;
    }[];
  }[];
};

function validateQuiz(quiz: Quiz) {
  if (quiz === null) return;
  for (const { questions } of quiz.batches) {
    for (const question of questions) {
      if (question.answers.length < 2) {
        throw new ConvexError("Each question must have at least 2 answers");
      }
      if (question.answers.filter((a) => a.correct).length !== 1) {
        throw new ConvexError(
          "Each question must have exactly 1 correct answer",
        );
      }
      const answers = new Set(question.answers.map((a) => a.text));
      if (answers.size !== question.answers.length) {
        throw new ConvexError(
          `Duplicated answer to question “${question.question}”`,
        );
      }
    }
  }
}
