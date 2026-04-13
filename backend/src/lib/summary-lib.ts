import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const summaryInclude = {
  project: true,
  files: true,
};

export function listSummaries(ctx: AppContext) {
  return ctx.prisma.summary.findMany({ orderBy: { id: "asc" }, include: summaryInclude });
}

export function getSummaryById(id: number, ctx: AppContext) {
  return ctx.prisma.summary.findUnique({ where: { id }, include: summaryInclude });
}

export function createSummary(data: Prisma.SummaryUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.summary.create({ data, include: summaryInclude });
}

export function updateSummary(id: number, data: Prisma.SummaryUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.summary.update({ where: { id }, data, include: summaryInclude });
}

export function deleteSummary(id: number, ctx: AppContext) {
  return ctx.prisma.summary.delete({ where: { id }, include: summaryInclude });
}

