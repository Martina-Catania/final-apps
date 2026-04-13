import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createQuiz, deleteQuiz, getQuizById, listQuizzes, updateQuiz } from "../../../src/lib/quiz-lib.js";

function createCtx() {
  const quiz = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { quiz } } as unknown as AppContext;
  return { ctx, quiz };
}

describe("quiz-lib", () => {
  it("lists quizzes", () => {
    const { ctx, quiz } = createCtx();
    listQuizzes(ctx);

    expect(quiz.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: { project: true, questions: true },
    });
  });

  it("gets quiz by id", () => {
    const { ctx, quiz } = createCtx();
    getQuizById(4, ctx);

    expect(quiz.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: { project: true, questions: true },
    });
  });

  it("creates quiz", () => {
    const { ctx, quiz } = createCtx();
    const data = { projectId: 2, difficulty: "EASY" };
    createQuiz(data as never, ctx);

    expect(quiz.create).toHaveBeenCalledWith({
      data,
      include: { project: true, questions: true },
    });
  });

  it("updates quiz", () => {
    const { ctx, quiz } = createCtx();
    const data = { difficulty: "HARD" };
    updateQuiz(7, data as never, ctx);

    expect(quiz.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data,
      include: { project: true, questions: true },
    });
  });

  it("deletes quiz", () => {
    const { ctx, quiz } = createCtx();
    deleteQuiz(7, ctx);

    expect(quiz.delete).toHaveBeenCalledWith({
      where: { id: 7 },
      include: { project: true, questions: true },
    });
  });
});