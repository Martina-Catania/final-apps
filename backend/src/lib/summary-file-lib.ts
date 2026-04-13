import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const summaryFileInclude = {
  summary: true,
};

export function listSummaryFiles(ctx: AppContext) {
  return ctx.prisma.summaryFile.findMany({ orderBy: { id: "asc" }, include: summaryFileInclude });
}

export function getSummaryFileById(id: number, ctx: AppContext) {
  return ctx.prisma.summaryFile.findUnique({ where: { id }, include: summaryFileInclude });
}

export function createSummaryFile(data: Prisma.SummaryFileUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.summaryFile.create({ data, include: summaryFileInclude });
}

export function updateSummaryFile(id: number, data: Prisma.SummaryFileUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.summaryFile.update({ where: { id }, data, include: summaryFileInclude });
}

export function deleteSummaryFile(id: number, ctx: AppContext) {
  return ctx.prisma.summaryFile.delete({ where: { id }, include: summaryFileInclude });
}

