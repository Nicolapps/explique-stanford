import { ConvexError, ObjectType, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { actionWithAuth, mutationWithAuth, queryWithAuth } from "./withAuth";
import Chance from "chance";

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
          ? shownQuestions(
              exercise.quiz,
              attempt.userId,
              attempt.exerciseId,
            ).map(toUserVisibleQuestion)
          : null,
      lastQuizSubmission: attempt.lastQuizSubmission ?? null,
    };
  },
});

type Question = {
  question: string;
  answers: { text: string; correct: boolean }[];
};

function shownQuestions(
  quiz: DatabaseQuiz,
  userId: Id<"users">,
  exerciseId: Id<"exercises">,
): Question[] {
  // @TODO Remove obsolete format
  if ("question" in quiz) {
    return [quiz];
  }

  const chance = new Chance(`${userId} ${exerciseId}`);
  return chance.shuffle(quiz.questions).slice(0, quiz.shownQuestionsCount);
}

type DatabaseQuiz =
  | Question
  | { shownQuestionsCount: number; questions: Question[] };

function toUserVisibleQuestion(question: Question): {
  question: string;
  answers: string[];
} {
  return {
    question: question.question,
    answers: question.answers.map((answer) => answer.text),
  };
}

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

    await db.insert("logs", {
      type: "quizStarted",
      userId: session.user._id,
      attemptId,
      exerciseId: attempt.exerciseId,
      variant: attempt.threadId === null ? "reading" : "explain",
    });

    await db.patch(attemptId, {
      status: "quiz",
    });
  },
});

export const submitQuiz = mutationWithAuth({
  args: {
    attemptId: v.id("attempts"),
    answers: v.array(v.number()),
  },
  handler: async ({ db, session }, { attemptId, answers }) => {
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

    const questions = shownQuestions(
      exercise.quiz,
      attempt.userId,
      attempt.exerciseId,
    );
    const correctAnswers = questions.map((q) => {
      const correctAnswer = q.answers.findIndex((a) => a.correct);
      if (correctAnswer === -1) throw new ConvexError("No correct answer");
      return correctAnswer;
    });
    if (correctAnswers.length !== answers.length) {
      throw new ConvexError("Incorrect number of answers");
    }

    const isCorrect = answers.every((a, i) => correctAnswers[i] === a);

    if (isCorrect) {
      await db.patch(attemptId, {
        status: "quizCompleted",
      });
    } else {
      await db.patch(attemptId, {
        lastQuizSubmission: Date.now(),
      });
    }

    db.insert("logs", {
      type: "quizSubmission",
      userId,
      attemptId,
      exerciseId: attempt.exerciseId,
      variant: attempt.threadId === null ? "reading" : "explain",
      details: {
        questions,
        answers,
        correctness:
          answers.filter((a, i) => correctAnswers[i] === a).length /
          answers.length,
      },
    });

    return { isCorrect };
  },
});
