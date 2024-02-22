import { ConvexError, v } from "convex/values";
import { mutationWithAuth } from "./withAuth";
import { validateDueDate } from "./weeks";
import { Doc, Id } from "./_generated/dataModel";
import Chance from "chance";

export type Question = {
  question: string;
  answers: { text: string; correct: boolean }[];
};

function indexes(count: number) {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(i);
  }
  return result;
}

function batchIndex(
  userId: Id<"users">,
  exerciseId: Id<"exercises">,
  assignment: Doc<"groupAssignments"> | null,
  batchesCount: number,
) {
  // Not an imported student? Assign a random batch based on the user ID
  if (assignment === null) {
    const chanceBatch = new Chance(`${userId} ${exerciseId} batch`);
    return chanceBatch.integer({ min: 0, max: batchesCount - 1 });
  }

  if (
    assignment.positionInGroup === undefined ||
    assignment.groupLength === undefined
  ) {
    console.warn("Invalid group assignment, please run assignNumbers");

    const chanceBatch = new Chance(`${userId} ${exerciseId} batch`);
    return chanceBatch.integer({ min: 0, max: batchesCount - 1 });
  }

  // Split the group evenly between the batches
  const chanceBatch = new Chance(`${exerciseId} ${assignment.group} batch`);
  const numbers = chanceBatch.shuffle(indexes(assignment.groupLength));
  return numbers.indexOf(assignment.positionInGroup) % batchesCount;
}

export function shownQuestions(
  quiz: { batches: { questions: Question[] }[] },
  userId: Id<"users">,
  exerciseId: Id<"exercises">,
  assignment: Doc<"groupAssignments"> | null,
): Question[] {
  if (quiz.batches.length === 0) throw new ConvexError("No quiz batches");

  const batch =
    quiz.batches[
      batchIndex(userId, exerciseId, assignment, quiz.batches.length)
    ];

  const chanceQuestionsOrder = new Chance(
    `${userId} ${exerciseId} questions order`,
  );
  return chanceQuestionsOrder.shuffle(batch.questions);
}

export const submit = mutationWithAuth({
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
    await validateDueDate(db, exercise, session.user);

    if (attempt.status !== "quiz") {
      throw new ConvexError("Incorrect status " + attempt.status);
    }

    const assignment = await db
      .query("groupAssignments")
      .withIndex("byEmail", (q) => q.eq("email", session.user.email))
      .first();

    const questions = shownQuestions(
      exercise.quiz,
      attempt.userId,
      attempt.exerciseId,
      assignment,
    );
    const correctAnswers = questions.map((q, questionIndex) => {
      const chanceAnswersOrder = new Chance(
        `${exercise._id} ${userId} ${questionIndex} answers order`,
      );

      const correctAnswer = chanceAnswersOrder
        .shuffle(q.answers)
        .findIndex((a) => a.correct);
      if (correctAnswer === -1) throw new ConvexError("No correct answer");
      return correctAnswer;
    });
    if (correctAnswers.length !== answers.length) {
      throw new ConvexError("Incorrect number of answers");
    }

    const isCorrect = answers.every((a, i) => correctAnswers[i] === a);

    await db.insert("quizSubmissions", {
      attemptId,
      answers,
    });

    if (isCorrect) {
      // @todo Make completedExercises non-optional
      const user = await db
        .query("users")
        .withIndex("byEmail", (q) => q.eq("email", session.user.email))
        .first();
      if (!user) throw new Error("No user");
      if (!(user.completedExercises ?? []).includes(attempt.exerciseId)) {
        await db.patch(user._id, {
          completedExercises: [
            ...(user.completedExercises ?? []),
            attempt.exerciseId,
          ],
        });
      }

      await db.patch(attemptId, {
        status: "quizCompleted",
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
