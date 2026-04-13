import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const tagInclude = {
  projects: {
    include: {
      project: true,
    },
  },
};

export function listTags(ctx: AppContext) {
  return ctx.prisma.tag.findMany({ orderBy: { id: "asc" }, include: tagInclude });
}

export function getTagById(id: number, ctx: AppContext) {
  return ctx.prisma.tag.findUnique({ where: { id }, include: tagInclude });
}

export function createTag(data: Prisma.TagUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.tag.create({ data, include: tagInclude });
}

export function updateTag(id: number, data: Prisma.TagUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.tag.update({ where: { id }, data, include: tagInclude });
}

export function deleteTag(id: number, ctx: AppContext) {
  return ctx.prisma.tag.delete({ where: { id }, include: tagInclude });
}

