import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createSummary, deleteSummary, getSummaryById, listSummaries, updateSummary } from "../../../src/lib/summary-lib.js";

function createCtx() {
  const summary = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { summary } } as unknown as AppContext;
  return { ctx, summary };
}

describe("summary-lib", () => {
  it("lists summaries", () => {
    const { ctx, summary } = createCtx();
    listSummaries(ctx);

    expect(summary.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: { project: true, files: true },
    });
  });

  it("gets summary by id", () => {
    const { ctx, summary } = createCtx();
    getSummaryById(8, ctx);

    expect(summary.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
      include: { project: true, files: true },
    });
  });

  it("creates summary", () => {
    const { ctx, summary } = createCtx();
    const data = { projectId: 2, subject: "History", content: "Text" };
    createSummary(data as never, ctx);

    expect(summary.create).toHaveBeenCalledWith({
      data,
      include: { project: true, files: true },
    });
  });

  it("updates summary", () => {
    const { ctx, summary } = createCtx();
    const data = { content: "Updated" };
    updateSummary(8, data as never, ctx);

    expect(summary.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data,
      include: { project: true, files: true },
    });
  });

  it("deletes summary", () => {
    const { ctx, summary } = createCtx();
    deleteSummary(8, ctx);

    expect(summary.delete).toHaveBeenCalledWith({
      where: { id: 8 },
      include: { project: true, files: true },
    });
  });
});