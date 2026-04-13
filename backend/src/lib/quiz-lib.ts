import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const quizInclude = {
  project: true,
  questions: true,
};

export function listQuizzes(ctx: AppContext) {
  return ctx.prisma.quiz.findMany({ orderBy: { id: "asc" }, include: quizInclude });
}

export function getQuizById(id: number, ctx: AppContext) {
  return ctx.prisma.quiz.findUnique({ where: { id }, include: quizInclude });
}

export function createQuiz(data: Prisma.QuizUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.quiz.create({ data, include: quizInclude });
}

export function updateQuiz(id: number, data: Prisma.QuizUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.quiz.update({ where: { id }, data, include: quizInclude });
}

export function deleteQuiz(id: number, ctx: AppContext) {
  return ctx.prisma.quiz.delete({ where: { id }, include: quizInclude });
}

