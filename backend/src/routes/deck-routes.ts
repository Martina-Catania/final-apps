import { ProjectType } from "../../generated/prisma/index.js";
import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createDeck,
  deleteDeck,
  getDeckById,
  listDecks,
  updateDeck,
} from "../lib/deck-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { parseIntParam, requireInt } from "../utils/http.js";

export function createDeckRouter(ctx: AppContext) {
  const deckRouter = Router();

  deckRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const decks = await listDecks(ctx);
      res.json(decks);
    }),
  );

  deckRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const deck = await getDeckById(id, ctx);

      if (!deck) {
        throw new ApiError(404, "Deck not found");
      }

      res.json(deck);
    }),
  );

  deckRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const projectId = requireInt(req.body.projectId, "projectId");

      const project = await ctx.prisma.project.findUnique({
        where: { id: projectId },
        select: { type: true },
      });

      if (!project) {
        throw new ApiError(404, "Project not found");
      }

      if (project.type !== ProjectType.DECK) {
        throw new ApiError(400, "Project type must be DECK");
      }

      const deck = await createDeck({ projectId }, ctx);
      res.status(201).json(deck);
    }),
  );

  deckRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const deck = await updateDeck(
        id,
        {
          projectId: typeof req.body.projectId === "number" ? requireInt(req.body.projectId, "projectId") : undefined,
        },
        ctx,
      );

      res.json(deck);
    }),
  );

  deckRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const deck = await deleteDeck(id, ctx);
      res.json(deck);
    }),
  );

  return deckRouter;
}

