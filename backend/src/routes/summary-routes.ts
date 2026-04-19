import { ProjectType } from "../../generated/prisma/index.js";
import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createSummary,
  deleteSummary,
  getSummaryById,
  listSummaries,
  updateSummary,
} from "../lib/summary-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { optionalString, parseIntParam, requireInt, requireString } from "../utils/http.js";

export function createSummaryRouter(ctx: AppContext) {
  const summaryRouter = Router();

  summaryRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const summaries = await listSummaries(ctx);
      res.json(summaries);
    }),
  );

  summaryRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const summary = await getSummaryById(id, ctx);

      if (!summary) {
        throw new ApiError(404, "Summary not found");
      }

      res.json(summary);
    }),
  );

  summaryRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const projectId = requireInt(req.body.projectId, "projectId");
      const content = requireString(req.body.content, "content");

      const project = await ctx.prisma.project.findUnique({
        where: { id: projectId },
        select: { type: true },
      });

      if (!project) {
        throw new ApiError(404, "Project not found");
      }

      if (project.type !== ProjectType.SUMMARY) {
        throw new ApiError(400, "Project type must be SUMMARY");
      }

      const summary = await createSummary({ projectId, content }, ctx);
      res.status(201).json(summary);
    }),
  );

  summaryRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");

      const summary = await updateSummary(
        id,
        {
          projectId: typeof req.body.projectId === "number" ? requireInt(req.body.projectId, "projectId") : undefined,
          content: optionalString(req.body.content, "content"),
        },
        ctx,
      );

      res.json(summary);
    }),
  );

  summaryRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const summary = await deleteSummary(id, ctx);
      res.json(summary);
    }),
  );

  return summaryRouter;
}

