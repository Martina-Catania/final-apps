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
  const quizInclude = {
    project: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    },
    questions: true,
  };

  it("lists quizzes", () => {
    const { ctx, quiz } = createCtx();
    listQuizzes(ctx);

    expect(quiz.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: quizInclude,
    });
  });

  it("gets quiz by id", () => {
    const { ctx, quiz } = createCtx();
    getQuizById(4, ctx);

    expect(quiz.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: quizInclude,
    });
  });

  it("creates quiz", () => {
    const { ctx, quiz } = createCtx();
    const data = { projectId: 2, difficulty: "EASY" };
    createQuiz(data as never, ctx);

    expect(quiz.create).toHaveBeenCalledWith({
      data,
      include: quizInclude,
    });
  });

  it("updates quiz", () => {
    const { ctx, quiz } = createCtx();
    const data = { difficulty: "HARD" };
    updateQuiz(7, data as never, ctx);

    expect(quiz.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data,
      include: quizInclude,
    });
  });

  it("deletes quiz", () => {
    const { ctx, quiz } = createCtx();
    deleteQuiz(7, ctx);

    expect(quiz.delete).toHaveBeenCalledWith({
      where: { id: 7 },
      include: quizInclude,
    });
  });
});