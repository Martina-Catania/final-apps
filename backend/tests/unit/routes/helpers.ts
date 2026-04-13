import express, { type Router } from "express";
import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { errorHandler } from "../../../src/middleware/error-handler.js";
import { notFoundHandler } from "../../../src/middleware/not-found.js";

export function createRouteMockContext() {
  const mocks = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    summary: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    summaryFile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quiz: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quizQuestion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deck: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    flashcard: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectTag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const ctx = {
    prisma: {
      user: mocks.user,
      project: mocks.project,
      follow: mocks.follow,
      summary: mocks.summary,
      summaryFile: mocks.summaryFile,
      quiz: mocks.quiz,
      quizQuestion: mocks.quizQuestion,
      deck: mocks.deck,
      flashcard: mocks.flashcard,
      tag: mocks.tag,
      projectTag: mocks.projectTag,
    },
  } as unknown as AppContext;

  return { ctx, mocks };
}

export function createRouteApp(basePath: string, router: Router) {
  const app = express();
  app.use(express.json());
  app.use(basePath, router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}