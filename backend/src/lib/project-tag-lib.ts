import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const projectTagInclude = {
  project: true,
  tag: true,
};

export function listProjectTags(ctx: AppContext) {
  return ctx.prisma.projectTag.findMany({
    orderBy: [{ projectId: "asc" }, { tagId: "asc" }],
    include: projectTagInclude,
  });
}

export function getProjectTag(projectId: number, tagId: number, ctx: AppContext) {
  return ctx.prisma.projectTag.findUnique({
    where: {
      projectId_tagId: {
        projectId,
        tagId,
      },
    },
    include: projectTagInclude,
  });
}

export function createProjectTag(data: Prisma.ProjectTagUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.projectTag.create({ data, include: projectTagInclude });
}

export function deleteProjectTag(projectId: number, tagId: number, ctx: AppContext) {
  return ctx.prisma.projectTag.delete({
    where: {
      projectId_tagId: {
        projectId,
        tagId,
      },
    },
    include: projectTagInclude,
  });
}

