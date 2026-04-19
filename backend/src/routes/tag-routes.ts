import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createTag,
  deleteTag,
  getTagById,
  listTags,
  updateTag,
} from "../lib/tag-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { optionalString, parseIntParam, requireString } from "../utils/http.js";

function normalizeTagName(value: string) {
  return value.toLocaleLowerCase();
}

export function createTagRouter(ctx: AppContext) {
  const tagRouter = Router();

  tagRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const tags = await listTags(ctx);
      res.json(tags);
    }),
  );

  tagRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const tag = await getTagById(id, ctx);

      if (!tag) {
        throw new ApiError(404, "Tag not found");
      }

      res.json(tag);
    }),
  );

  tagRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const name = normalizeTagName(requireString(req.body.name, "name"));
      const tag = await createTag({ name }, ctx);
      res.status(201).json(tag);
    }),
  );

  tagRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const name = optionalString(req.body.name, "name");

      const tag = await updateTag(
        id,
        {
          name: typeof name === "string" ? normalizeTagName(name) : undefined,
        },
        ctx,
      );

      res.json(tag);
    }),
  );

  tagRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const tag = await deleteTag(id, ctx);
      res.json(tag);
    }),
  );

  return tagRouter;
}

