import { Router } from "express";
import type { AppContext } from "../context.js";
import { requireAuth } from "../middleware/auth.js";
import { searchCatalog } from "../lib/search-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

const DEFAULT_USERS_PAGE = 1;
const DEFAULT_USERS_LIMIT = 10;
const DEFAULT_PROJECTS_PAGE = 1;
const DEFAULT_PROJECTS_LIMIT = 20;
const MAX_USERS_LIMIT = 50;
const MAX_PROJECTS_LIMIT = 100;

function parseOptionalSearchQuery(value: unknown): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === undefined) {
    return undefined;
  }

  if (typeof rawValue !== "string") {
    throw new ApiError(400, "q must be a string");
  }

  const query = rawValue.trim();

  return query.length > 0 ? query : undefined;
}

function parseTagIdsQuery(value: unknown): number[] {
  const rawValues = Array.isArray(value) ? value : value === undefined ? [] : [value];

  const tagIds = new Set<number>();

  for (const rawValue of rawValues) {
    if (typeof rawValue !== "string") {
      throw new ApiError(400, "tagIds must be a positive integer list");
    }

    const chunks = rawValue.split(",");

    for (const chunk of chunks) {
      const trimmed = chunk.trim();

      if (!trimmed) {
        continue;
      }

      const parsedValue = Number.parseInt(trimmed, 10);

      if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new ApiError(400, "tagIds must be a positive integer list");
      }

      tagIds.add(parsedValue);
    }
  }

  return [...tagIds];
}

function parsePositiveIntQuery(
  value: unknown,
  name: string,
  defaultValue: number,
  maxValue: number,
): number {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === undefined) {
    return defaultValue;
  }

  if (typeof rawValue !== "string") {
    throw new ApiError(400, `${name} must be a positive integer`);
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new ApiError(400, `${name} must be a positive integer`);
  }

  if (parsedValue > maxValue) {
    throw new ApiError(400, `${name} must be less than or equal to ${maxValue}`);
  }

  return parsedValue;
}

export function createSearchRouter(ctx: AppContext) {
  const searchRouter = Router();

  searchRouter.get(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const query = parseOptionalSearchQuery(req.query.q);
      const tagIds = parseTagIdsQuery(req.query.tagIds);

      if (!query && tagIds.length === 0) {
        throw new ApiError(400, "q or tagIds is required");
      }

      const usersPage = parsePositiveIntQuery(
        req.query.usersPage,
        "usersPage",
        DEFAULT_USERS_PAGE,
        Number.MAX_SAFE_INTEGER,
      );
      const usersLimit = parsePositiveIntQuery(
        req.query.usersLimit,
        "usersLimit",
        DEFAULT_USERS_LIMIT,
        MAX_USERS_LIMIT,
      );
      const projectsPage = parsePositiveIntQuery(
        req.query.projectsPage,
        "projectsPage",
        DEFAULT_PROJECTS_PAGE,
        Number.MAX_SAFE_INTEGER,
      );
      const projectsLimit = parsePositiveIntQuery(
        req.query.projectsLimit,
        "projectsLimit",
        DEFAULT_PROJECTS_LIMIT,
        MAX_PROJECTS_LIMIT,
      );

      const payload = await searchCatalog(
        {
          query,
          tagIds,
          usersPage,
          usersLimit,
          projectsPage,
          projectsLimit,
        },
        ctx,
      );

      res.json(payload);
    }),
  );

  return searchRouter;
}