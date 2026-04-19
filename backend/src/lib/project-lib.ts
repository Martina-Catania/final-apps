import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const projectInclude = {
  summary: true,
  quiz: true,
  deck: true,
  tags: {
    include: {
      tag: true,
    },
  },
};

const followedProjectInclude = {
  user: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  },
  quiz: {
    select: {
      id: true,
    },
  },
  summary: {
    select: {
      id: true,
    },
  },
  deck: {
    select: {
      id: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
};

export function listProjects(ctx: AppContext) {
  return ctx.prisma.project.findMany({ orderBy: { id: "asc" }, include: projectInclude });
}

export function listProjectsByFollowing(userId: number, ctx: AppContext) {
  return ctx.prisma.project.findMany({
    where: {
      type: {
        in: ["QUIZ", "DECK", "SUMMARY"],
      },
      user: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: followedProjectInclude,
  });
}

export function getProjectById(id: number, ctx: AppContext) {
  return ctx.prisma.project.findUnique({ where: { id }, include: projectInclude });
}

export function createProject(data: Prisma.ProjectUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.project.create({ data, include: projectInclude });
}

export function updateProject(id: number, data: Prisma.ProjectUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.project.update({ where: { id }, data, include: projectInclude });
}

export function deleteProject(id: number, ctx: AppContext) {
  return ctx.prisma.project.delete({ where: { id }, include: projectInclude });
}

export function incrementProjectTimesPlayed(id: number, ctx: AppContext) {
  return ctx.prisma.project.update({
    where: { id },
    data: { timesPlayed: { increment: 1 } },
    include: projectInclude,
  });
}

