import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const deckInclude = {
  project: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  },
  flashcards: true,
};

export function listDecks(ctx: AppContext) {
  return ctx.prisma.deck.findMany({ orderBy: { id: "asc" }, include: deckInclude });
}

export function getDeckById(id: number, ctx: AppContext) {
  return ctx.prisma.deck.findUnique({ where: { id }, include: deckInclude });
}

export function createDeck(data: Prisma.DeckUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.deck.create({ data, include: deckInclude });
}

export function updateDeck(id: number, data: Prisma.DeckUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.deck.update({ where: { id }, data, include: deckInclude });
}

export function deleteDeck(id: number, ctx: AppContext) {
  return ctx.prisma.deck.delete({ where: { id }, include: deckInclude });
}

