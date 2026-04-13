import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const flashcardInclude = {
  deck: true,
};

export function listFlashcards(ctx: AppContext) {
  return ctx.prisma.flashcard.findMany({ orderBy: { id: "asc" }, include: flashcardInclude });
}

export function getFlashcardById(id: number, ctx: AppContext) {
  return ctx.prisma.flashcard.findUnique({ where: { id }, include: flashcardInclude });
}

export function createFlashcard(data: Prisma.FlashcardUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.flashcard.create({ data, include: flashcardInclude });
}

export function updateFlashcard(id: number, data: Prisma.FlashcardUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.flashcard.update({ where: { id }, data, include: flashcardInclude });
}

export function deleteFlashcard(id: number, ctx: AppContext) {
  return ctx.prisma.flashcard.delete({ where: { id }, include: flashcardInclude });
}

