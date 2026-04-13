import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import {
  createSummaryFile,
  deleteSummaryFile,
  getSummaryFileById,
  listSummaryFiles,
  updateSummaryFile,
} from "../../../src/lib/summary-file-lib.js";

function createCtx() {
  const summaryFile = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { summaryFile } } as unknown as AppContext;
  return { ctx, summaryFile };
}

describe("summary-file-lib", () => {
  it("lists summary files", () => {
    const { ctx, summaryFile } = createCtx();
    listSummaryFiles(ctx);

    expect(summaryFile.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: { summary: true },
    });
  });

  it("gets summary file by id", () => {
    const { ctx, summaryFile } = createCtx();
    getSummaryFileById(8, ctx);

    expect(summaryFile.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
      include: { summary: true },
    });
  });

  it("creates summary file", () => {
    const { ctx, summaryFile } = createCtx();
    const data = { summaryId: 2, fileName: "notes.pdf", fileUrl: "https://example.test/file.pdf" };
    createSummaryFile(data as never, ctx);

    expect(summaryFile.create).toHaveBeenCalledWith({
      data,
      include: { summary: true },
    });
  });

  it("updates summary file", () => {
    const { ctx, summaryFile } = createCtx();
    const data = { fileName: "updated.pdf" };
    updateSummaryFile(8, data as never, ctx);

    expect(summaryFile.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data,
      include: { summary: true },
    });
  });

  it("deletes summary file", () => {
    const { ctx, summaryFile } = createCtx();
    deleteSummaryFile(8, ctx);

    expect(summaryFile.delete).toHaveBeenCalledWith({
      where: { id: 8 },
      include: { summary: true },
    });
  });
});