import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  getQuizQuestionById,
  listQuizQuestions,
  updateQuizQuestion,
} from "../../../src/lib/quiz-question-lib.js";

function createCtx() {
  const quizQuestion = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { quizQuestion } } as unknown as AppContext;
  return { ctx, quizQuestion };
}

describe("quiz-question-lib", () => {
  it("lists quiz questions", () => {
    const { ctx, quizQuestion } = createCtx();
    listQuizQuestions(ctx);

    expect(quizQuestion.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: { quiz: true },
    });
  });

  it("gets quiz question by id", () => {
    const { ctx, quizQuestion } = createCtx();
    getQuizQuestionById(8, ctx);

    expect(quizQuestion.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
      include: { quiz: true },
    });
  });

  it("creates quiz question", () => {
    const { ctx, quizQuestion } = createCtx();
    const data = { quizId: 2, prompt: "Prompt", answer: "Answer" };
    createQuizQuestion(data as never, ctx);

    expect(quizQuestion.create).toHaveBeenCalledWith({
      data,
      include: { quiz: true },
    });
  });

  it("updates quiz question", () => {
    const { ctx, quizQuestion } = createCtx();
    const data = { prompt: "Updated" };
    updateQuizQuestion(8, data as never, ctx);

    expect(quizQuestion.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data,
      include: { quiz: true },
    });
  });

  it("deletes quiz question", () => {
    const { ctx, quizQuestion } = createCtx();
    deleteQuizQuestion(8, ctx);

    expect(quizQuestion.delete).toHaveBeenCalledWith({
      where: { id: 8 },
      include: { quiz: true },
    });
  });
});