import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import {
  createFlashcard,
  deleteFlashcard,
  getFlashcardById,
  listFlashcards,
  updateFlashcard,
} from "../../../src/lib/flashcard-lib.js";

function createCtx() {
  const flashcard = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { flashcard } } as unknown as AppContext;
  return { ctx, flashcard };
}

describe("flashcard-lib", () => {
  it("lists flashcards with include", () => {
    const { ctx, flashcard } = createCtx();
    listFlashcards(ctx);

    expect(flashcard.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: { deck: true },
    });
  });

  it("gets flashcard by id", () => {
    const { ctx, flashcard } = createCtx();
    getFlashcardById(4, ctx);

    expect(flashcard.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: { deck: true },
    });
  });

  it("creates flashcard", () => {
    const { ctx, flashcard } = createCtx();
    const data = { deckId: 2, question: "Q", answer: "A" };
    createFlashcard(data as never, ctx);

    expect(flashcard.create).toHaveBeenCalledWith({
      data,
      include: { deck: true },
    });
  });

  it("updates flashcard", () => {
    const { ctx, flashcard } = createCtx();
    const data = { answer: "Updated" };
    updateFlashcard(7, data as never, ctx);

    expect(flashcard.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data,
      include: { deck: true },
    });
  });

  it("deletes flashcard", () => {
    const { ctx, flashcard } = createCtx();
    deleteFlashcard(3, ctx);

    expect(flashcard.delete).toHaveBeenCalledWith({
      where: { id: 3 },
      include: { deck: true },
    });
  });
});