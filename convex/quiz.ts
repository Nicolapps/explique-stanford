import { ConvexError, v } from "convex/values";
import { mutationWithAuth } from "./withAuth";
import { validateDueDate } from "./weeks";
import { Id } from "./_generated/dataModel";
import Chance from "chance";

export type Question = {
  question: string;
  answers: { text: string; correct: boolean }[];
};

export function shownQuestions(
  quiz: { batches: { questions: Question[] }[] },
  userId: Id<"users">,
  exerciseId: Id<"exercises">,
): Question[] {
  const batch = quiz.batches[0]; // @TODO Choose batch correctly

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

    const questions = shownQuestions(
      exercise.quiz,
      attempt.userId,
      attempt.exerciseId,
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
