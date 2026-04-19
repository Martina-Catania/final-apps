import { ProjectType } from "../../generated/prisma/index.js";
import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createProject,
  deleteProject,
  getProjectById,
  incrementProjectTimesPlayed,
  listProjects,
  updateProject,
} from "../lib/project-lib.js";
import { createProjectTag, deleteProjectTag } from "../lib/project-tag-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import {
  optionalString,
  parseIntParam,
  requireEnum,
  requireInt,
  requireString,
} from "../utils/http.js";

export function createProjectRouter(ctx: AppContext) {
  const projectRouter = Router();

  projectRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const projects = await listProjects(ctx);
      res.json(projects);
    }),
  );

  projectRouter.get(
    "/:id/tags",
    asyncHandler(async (req, res) => {
      const projectId = parseIntParam(req.params.id, "id");
      const projectTags = await ctx.prisma.projectTag.findMany({
        where: { projectId },
        include: { tag: true },
        orderBy: { tagId: "asc" },
      });

      res.json(projectTags);
    }),
  );

  projectRouter.post(
    "/:id/tags/:tagId",
    asyncHandler(async (req, res) => {
      const projectId = parseIntParam(req.params.id, "id");
      const tagId = parseIntParam(req.params.tagId, "tagId");

      const projectTag = await createProjectTag({ projectId, tagId }, ctx);
      res.status(201).json(projectTag);
    }),
  );

  projectRouter.delete(
    "/:id/tags/:tagId",
    asyncHandler(async (req, res) => {
      const projectId = parseIntParam(req.params.id, "id");
      const tagId = parseIntParam(req.params.tagId, "tagId");
      const projectTag = await deleteProjectTag(projectId, tagId, ctx);
      res.json(projectTag);
    }),
  );

  projectRouter.post(
    "/:id/times-played/increment",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const project = await incrementProjectTimesPlayed(id, ctx);
      res.json(project);
    }),
  );

  projectRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const project = await getProjectById(id, ctx);

      if (!project) {
        throw new ApiError(404, "Project not found");
      }

      res.json(project);
    }),
  );

  projectRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const type = requireEnum(req.body.type, Object.values(ProjectType), "type");
      const title = requireString(req.body.title, "title");
      const userId = requireInt(req.body.userId, "userId");

      const project = await createProject({ type, title, userId }, ctx);
      res.status(201).json(project);
    }),
  );

  projectRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");

      const nextType = req.body.type
        ? requireEnum(req.body.type, Object.values(ProjectType), "type")
        : undefined;

      const project = await updateProject(
        id,
        {
          title: optionalString(req.body.title, "title"),
          type: nextType,
          userId: typeof req.body.userId === "number" ? requireInt(req.body.userId, "userId") : undefined,
        },
        ctx,
      );

      res.json(project);
    }),
  );

  projectRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const project = await deleteProject(id, ctx);
      res.json(project);
    }),
  );

  return projectRouter;
}

