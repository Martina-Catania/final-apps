import { unlink } from "node:fs/promises";
import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createSummaryFile,
  deleteSummaryFile,
  getSummaryFileById,
  listSummaryFiles,
  updateSummaryFile,
} from "../lib/summary-file-lib.js";
import { summaryDocumentUploadSingle } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { optionalString, parseIntParam, requireInt, requireString } from "../utils/http.js";

function isMultipartRequest(contentType: string | string[] | undefined) {
  const headerValue = Array.isArray(contentType) ? contentType.join(";") : contentType ?? "";
  return headerValue.includes("multipart/form-data");
}

function requireMultipartInt(value: unknown, name: string) {
  if (typeof value === "number") {
    return requireInt(value, name);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || !/^\d+$/.test(trimmed)) {
      throw new ApiError(400, `${name} must be a positive integer`);
    }

    const parsed = Number.parseInt(trimmed, 10);
    return requireInt(parsed, name);
  }

  throw new ApiError(400, `${name} must be a positive integer`);
}

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
    summaryDocumentUploadSingle,
    asyncHandler(async (req, res) => {
      if (req.file) {
        const summaryId = requireMultipartInt(req.body.summaryId, "summaryId");

        try {
          const file = await createSummaryFile({ summaryId, filename: req.file.filename }, ctx);
          res.status(201).json(file);
        } catch (error) {
          void unlink(req.file.path).catch(() => undefined);
          throw error;
        }

        return;
      }

      if (isMultipartRequest(req.headers["content-type"])) {
        throw new ApiError(400, "Summary document file is required");
      }

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

