import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { actionWithAuth, mutationWithAuth, queryWithAuth } from "./withAuth";

export const get = queryWithAuth({
  args: {
    id: v.id("attempts"),
  },
  handler: async ({ db, session }, { id }) => {
    if (!session) {
      throw new ConvexError("Not logged in");
    }

    const attempt = await db.get(id);
    if (attempt === null) throw new ConvexError("Unknown attempt");

    if (attempt.userId !== session.user._id && !session.user.isAdmin) {
      throw new Error("Attempt from someone else");
    }

    const exercise = await db.get(attempt.exerciseId);
    if (exercise === null) throw new Error("No exercise");

    return {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      status: attempt.status,
      text: attempt.threadId === null ? exercise.text : null,
      quiz:
        attempt.status === "quiz" || attempt.status === "quizCompleted"
          ? {
              question: exercise.quiz.question,
              answers: exercise.quiz.answers.map((a) => a.text),
            }
          : null,
      lastQuizSubmission: attempt.lastQuizSubmission ?? null,
    };
  },
});

export const insert = internalMutation({
  args: {
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    threadId: v.union(v.string(), v.null()),
    firstMessage: v.optional(v.string()),
  },
  handler: async ({ db }, { exerciseId, userId, threadId, firstMessage }) => {
    const attemptId = await db.insert("attempts", {
      status: "exercise",
      exerciseId,
      userId,
      threadId,
    });

    if (firstMessage) {
      await db.insert("messages", {
        attemptId,
        system: true,
        content: firstMessage,
      });
    }

    return attemptId;
  },
});

export const start = actionWithAuth({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, { exerciseId }) => {
    if (!ctx.session) throw new ConvexError("Not logged in");
    const userId = ctx.session.user._id;

    const exercise = await ctx.runQuery(internal.exercises.getRow, {
      id: exerciseId,
    });
    if (exercise === null) throw new ConvexError("Unknown exercise");

    const isUsingExplainVariant = await ctx.runQuery(
      internal.attempts.isUsingExplainVariant,
      {
        exerciseId,
        userId,
        seed: Math.random(),
      },
    );
    let threadId = null;
    const openai = new OpenAI();
    if (isUsingExplainVariant) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    const attemptId: Id<"attempts"> = await ctx.runMutation(
      internal.attempts.insert,
      {
        exerciseId,
        userId,
        threadId,
        firstMessage: exercise.firstMessage,
      },
    );

    return attemptId;
  },
});

export const isUsingExplainVariant = internalQuery({
  args: {
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    seed: v.number(),
  },
  handler: async ({ db }, { exerciseId, userId }) => {
    const exercise = await db.get(exerciseId);
    if (exercise === null) throw new Error("Unknown exercise");

    const user = await db.get(userId);
    if (user === null) throw new Error("Unknown user");

    const { controlGroup } = exercise;
    const { group } = user;

    return group !== controlGroup;
  },
});

export const goToQuiz = mutationWithAuth({
  args: {
    attemptId: v.id("attempts"),
  },
  handler: async ({ db, session }, { attemptId }) => {
    if (!session) throw new ConvexError("Not logged in");

    const attempt = await db.get(attemptId);
    if (attempt === null) throw new ConvexError("Unknown attempt");

    if (attempt.userId !== session.user._id && !session.user.isAdmin) {
      throw new Error("Attempt from someone else");
    }

    const exercise = await db.get(attempt.exerciseId);
    if (exercise === null) throw new Error("No exercise");

    if (
      attempt.status !== "exercise" &&
      attempt.status !== "exerciseCompleted"
    ) {
      throw new Error("Unexpected state " + attempt.status);
    }

    await db.patch(attemptId, {
      status: "quiz",
    });
  },
});

export const submitQuiz = mutationWithAuth({
  args: {
    attemptId: v.id("attempts"),
    answer: v.number(),
  },
  handler: async ({ db, session }, { attemptId, answer }) => {
    if (!session) throw new ConvexError("Not logged in");
    const userId = session.user._id;

    const attempt = await db.get(attemptId);
    if (attempt === null) throw new ConvexError("Unknown attempt");

    if (attempt.userId !== session.user._id && !session.user.isAdmin) {
      throw new Error("Attempt from someone else");
    }

    const exercise = await db.get(attempt.exerciseId);
    if (exercise === null) throw new Error("No exercise");

    if (attempt.status !== "quiz") {
      throw new ConvexError("Incorrect status " + attempt.status);
    }

    const correctAnswer = exercise.quiz.answers.findIndex((a) => a.correct);
    if (correctAnswer === -1) throw new ConvexError("No correct answer");

    const isCorrect = correctAnswer === answer;
    if (isCorrect) {
      await db.patch(attemptId, {
        status: "quizCompleted",
      });
    } else {
      await db.patch(attemptId, {
        lastQuizSubmission: Date.now(),
      });
    }

    return { isCorrect };
  },
});
