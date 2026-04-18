import jwt, { type SignOptions } from "jsonwebtoken";
import { ApiError } from "./api-error.js";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, "JWT secret is not configured");
  }

  return secret;
}

export function generateAuthToken(userId: number) {
  return jwt.sign({ sub: String(userId) }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): { userId: number } {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded !== "object" || decoded === null || typeof decoded.sub !== "string") {
      throw new ApiError(401, "Invalid token");
    }

    const userId = Number.parseInt(decoded.sub, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ApiError(401, "Invalid token");
    }

    return { userId };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, "Invalid or expired token");
  }
}