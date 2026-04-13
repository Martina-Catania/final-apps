import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createProjectTag,
  deleteProjectTag,
  getProjectTag,
  listProjectTags,
} from "../lib/project-tag-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { parseIntParam, requireInt } from "../utils/http.js";

export function createProjectTagRouter(ctx: AppContext) {
  const projectTagRouter = Router();

  projectTagRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const projectTags = await listProjectTags(ctx);
      res.json(projectTags);
    }),
  );

  projectTagRouter.get(
    "/:projectId/:tagId",
    asyncHandler(async (req, res) => {
      const projectId = parseIntParam(req.params.projectId, "projectId");
      const tagId = parseIntParam(req.params.tagId, "tagId");

      const projectTag = await getProjectTag(projectId, tagId, ctx);
      if (!projectTag) {
        throw new ApiError(404, "Project tag relation not found");
      }

      res.json(projectTag);
    }),
  );

  projectTagRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const projectId = requireInt(req.body.projectId, "projectId");
      const tagId = requireInt(req.body.tagId, "tagId");

      const projectTag = await createProjectTag({ projectId, tagId }, ctx);
      res.status(201).json(projectTag);
    }),
  );

  projectTagRouter.delete(
    "/:projectId/:tagId",
    asyncHandler(async (req, res) => {
      const projectId = parseIntParam(req.params.projectId, "projectId");
      const tagId = parseIntParam(req.params.tagId, "tagId");

      const projectTag = await deleteProjectTag(projectId, tagId, ctx);
      res.json(projectTag);
    }),
  );

  return projectTagRouter;
}

