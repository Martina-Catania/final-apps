import { jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/index.js";
import { errorHandler } from "../../../src/middleware/error-handler.js";
import { notFoundHandler } from "../../../src/middleware/not-found.js";
import { ApiError } from "../../../src/utils/api-error.js";

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

function createMockResponse(): MockResponse {
  const status = jest.fn();
  const json = jest.fn();
  const res = { status, json } as unknown as Response;
  status.mockReturnValue(res);
  json.mockReturnValue(res);
  return res as MockResponse;
}

function createPrismaKnownRequestError(code: string, meta?: Record<string, unknown>) {
  const error = { code, meta } as { code: string; meta?: Record<string, unknown> };
  Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);
  return error as Prisma.PrismaClientKnownRequestError;
}

describe("middleware", () => {
  describe("notFoundHandler", () => {
    it("returns 404 route not found payload", () => {
      const res = createMockResponse();

      notFoundHandler({} as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Route not found" });
    });
  });

  describe("errorHandler", () => {
    it("returns ApiError status and payload", () => {
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;
      const error = new ApiError(422, "Validation failed", { field: "email" });

      errorHandler(error, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: { field: "email" },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("maps Prisma P2002 to 409", () => {
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;
      const error = createPrismaKnownRequestError("P2002", { target: ["email"] });

      errorHandler(error, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unique constraint failed",
        details: { target: ["email"] },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("maps Prisma P2003 to 400", () => {
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;
      const error = createPrismaKnownRequestError("P2003", { field_name: "userId" });

      errorHandler(error, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Foreign key constraint failed",
        details: { field_name: "userId" },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("maps Prisma P2025 to 404", () => {
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;
      const error = createPrismaKnownRequestError("P2025", { cause: "Record does not exist" });

      errorHandler(error, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Record not found" });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 500 with message for generic Error", () => {
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;

      errorHandler(new Error("Boom"), {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
        details: "Boom",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 500 with unknown error fallback for non-Error values", () => {
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;

      errorHandler("boom" as unknown, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
        details: "Unknown error",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
