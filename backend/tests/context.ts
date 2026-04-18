import type { PrismaClient } from "../generated/prisma/index.js";
import { jest } from "@jest/globals";
import type { AppContext } from "../src/context.js";

export type PrismaMethodMocks = {
  user: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  project: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  follow: {
    findUnique: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
      findUnique: mocks.user.findUnique,
      create: mocks.user.create,
      update: mocks.user.update,
    },
    project: {
      findUnique: mocks.project.findUnique,
      findMany: mocks.project.findMany,
      count: mocks.project.count,
    },
    follow: {
      findUnique: mocks.follow.findUnique,
      create: mocks.follow.create,
      delete: mocks.follow.delete,
      count: mocks.follow.count,
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
