import type { PrismaClient } from "../generated/prisma/index.js";
import { jest } from "@jest/globals";
import type { AppContext } from "../src/context.js";

export type PrismaMethodMocks = {
  user: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  project: {
    findUnique: jest.Mock;
  };
  summary: {
    create: jest.Mock;
  };
  projectTag: {
    create: jest.Mock;
  };
};

export type MockContext = {
  prisma: PrismaClient;
  mocks: PrismaMethodMocks;
};

export function createMockContext(): MockContext {
  const mocks: PrismaMethodMocks = {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    summary: {
      create: jest.fn(),
    },
    projectTag: {
      create: jest.fn(),
    },
  };

  const prisma = {
    user: {
      findMany: mocks.user.findMany,
      create: mocks.user.create,
    },
    project: {
      findUnique: mocks.project.findUnique,
    },
    summary: {
      create: mocks.summary.create,
    },
    projectTag: {
      create: mocks.projectTag.create,
    },
  } as unknown as PrismaClient;

  return {
    prisma,
    mocks,
  };
}

export function asAppContext(mockContext: MockContext): AppContext {
  return mockContext as unknown as AppContext;
}
