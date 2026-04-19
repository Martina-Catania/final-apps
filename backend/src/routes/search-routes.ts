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

function parseSearchQuery(value: unknown): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== "string") {
    throw new ApiError(400, "q is required");
  }

  const query = rawValue.trim();

  if (!query) {
    throw new ApiError(400, "q cannot be empty");
  }

  return query;
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
      const query = parseSearchQuery(req.query.q);
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