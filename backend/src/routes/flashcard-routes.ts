import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createFlashcard,
  deleteFlashcard,
  getFlashcardById,
  listFlashcards,
  updateFlashcard,
} from "../lib/flashcard-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import {
  optionalString,
  parseIntParam,
  requireInt,
  requireString,
} from "../utils/http.js";

export function createFlashcardRouter(ctx: AppContext) {
  const flashcardRouter = Router();

  flashcardRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const flashcards = await listFlashcards(ctx);
      res.json(flashcards);
    }),
  );

  flashcardRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const flashcard = await getFlashcardById(id, ctx);

      if (!flashcard) {
        throw new ApiError(404, "Flashcard not found");
      }

      res.json(flashcard);
    }),
  );

  flashcardRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const deckId = requireInt(req.body.deckId, "deckId");
      const front = requireString(req.body.front, "front");
      const back = requireString(req.body.back, "back");

      const flashcard = await createFlashcard({ deckId, front, back }, ctx);
      res.status(201).json(flashcard);
    }),
  );

  flashcardRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");

      const flashcard = await updateFlashcard(
        id,
        {
          deckId: typeof req.body.deckId === "number" ? requireInt(req.body.deckId, "deckId") : undefined,
          front: optionalString(req.body.front, "front"),
          back: optionalString(req.body.back, "back"),
        },
        ctx,
      );

      res.json(flashcard);
    }),
  );

  flashcardRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const flashcard = await deleteFlashcard(id, ctx);
      res.json(flashcard);
    }),
  );

  return flashcardRouter;
}

