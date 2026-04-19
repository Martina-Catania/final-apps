import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { Prisma } from "../../generated/prisma/index.js";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      if (error.field === "file") {
        res.status(400).json({ error: "Summary file must be 10MB or smaller" });
        return;
      }

      res.status(400).json({ error: "Avatar image must be 5MB or smaller" });
      return;
    }

    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Unique constraint failed", details: error.meta });
      return;
    }

    if (error.code === "P2003") {
      res.status(400).json({ error: "Foreign key constraint failed", details: error.meta });
      return;
    }

    if (error.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
  }

  const fallbackMessage = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ error: "Internal server error", details: fallbackMessage });
}

