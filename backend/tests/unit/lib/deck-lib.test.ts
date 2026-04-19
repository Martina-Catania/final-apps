import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createDeck, deleteDeck, getDeckById, listDecks, updateDeck } from "../../../src/lib/deck-lib.js";

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
      tags: {
        include: {
          tag: true,
        },
      },
    },
  },
  flashcards: true,
};

function createCtx() {
  const deck = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { deck } } as unknown as AppContext;
  return { ctx, deck };
}

describe("deck-lib", () => {
  it("lists decks with include", () => {
    const { ctx, deck } = createCtx();
    listDecks(ctx);

    expect(deck.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: deckInclude,
    });
  });

  it("gets deck by id with include", () => {
    const { ctx, deck } = createCtx();
    getDeckById(4, ctx);

    expect(deck.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: deckInclude,
    });
  });

  it("creates deck", () => {
    const { ctx, deck } = createCtx();
    const data = { projectId: 2, title: "Deck" };
    createDeck(data as never, ctx);

    expect(deck.create).toHaveBeenCalledWith({
      data,
      include: deckInclude,
    });
  });

  it("updates deck", () => {
    const { ctx, deck } = createCtx();
    const data = { title: "Updated" };
    updateDeck(7, data as never, ctx);

    expect(deck.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data,
      include: deckInclude,
    });
  });

  it("deletes deck", () => {
    const { ctx, deck } = createCtx();
    deleteDeck(3, ctx);

    expect(deck.delete).toHaveBeenCalledWith({
      where: { id: 3 },
      include: deckInclude,
    });
  });
});