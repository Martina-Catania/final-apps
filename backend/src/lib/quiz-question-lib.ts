import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const quizQuestionInclude = {
  quiz: true,
};

export function listQuizQuestions(ctx: AppContext) {
  return ctx.prisma.quizQuestion.findMany({
    orderBy: { id: "asc" },
    include: quizQuestionInclude,
  });
}

export function getQuizQuestionById(id: number, ctx: AppContext) {
  return ctx.prisma.quizQuestion.findUnique({ where: { id }, include: quizQuestionInclude });
}

export function createQuizQuestion(data: Prisma.QuizQuestionUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.quizQuestion.create({ data, include: quizQuestionInclude });
}

export function updateQuizQuestion(id: number, data: Prisma.QuizQuestionUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.quizQuestion.update({ where: { id }, data, include: quizQuestionInclude });
}

export function deleteQuizQuestion(id: number, ctx: AppContext) {
  return ctx.prisma.quizQuestion.delete({ where: { id }, include: quizQuestionInclude });
}

