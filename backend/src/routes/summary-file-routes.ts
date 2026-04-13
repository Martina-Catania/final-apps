import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createSummaryFile,
  deleteSummaryFile,
  getSummaryFileById,
  listSummaryFiles,
  updateSummaryFile,
} from "../lib/summary-file-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { optionalString, parseIntParam, requireInt, requireString } from "../utils/http.js";

export function createSummaryFileRouter(ctx: AppContext) {
  const summaryFileRouter = Router();

  summaryFileRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const files = await listSummaryFiles(ctx);
      res.json(files);
    }),
  );

  summaryFileRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const file = await getSummaryFileById(id, ctx);

      if (!file) {
        throw new ApiError(404, "Summary file not found");
      }

      res.json(file);
    }),
  );

  summaryFileRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const summaryId = requireInt(req.body.summaryId, "summaryId");
      const filename = requireString(req.body.filename, "filename");

      const file = await createSummaryFile({ summaryId, filename }, ctx);
      res.status(201).json(file);
    }),
  );

  summaryFileRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");

      const file = await updateSummaryFile(
        id,
        {
          summaryId: typeof req.body.summaryId === "number" ? requireInt(req.body.summaryId, "summaryId") : undefined,
          filename: optionalString(req.body.filename, "filename"),
        },
        ctx,
      );

      res.json(file);
    }),
  );

  summaryFileRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const file = await deleteSummaryFile(id, ctx);
      res.json(file);
    }),
  );

  return summaryFileRouter;
}

