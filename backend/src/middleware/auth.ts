import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyAuthToken } from "../utils/jwt.js";

const BEARER_PREFIX = "Bearer ";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");

  if (!authorization || !authorization.startsWith(BEARER_PREFIX)) {
    throw new ApiError(401, "Authorization token is required");
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    throw new ApiError(401, "Authorization token is required");
  }

  const { userId } = verifyAuthToken(token);
  res.locals.authUserId = userId;

  next();
}

export function getAuthUserId(res: Response): number {
  const userId = res.locals.authUserId;

  if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(401, "Unauthorized");
  }

  return userId;
}