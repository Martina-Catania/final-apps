import type { Prisma, ProjectType } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

type ProfileProject = {
  id: number;
  type: ProjectType;
  title: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  quizId: number | null;
  deckId: number | null;
};

export type UserProfileSummary = {
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    projectCount: number;
  };
  isFollowing: boolean;
  projects: ProfileProject[];
};

export function listUsers(ctx: AppContext) {
  return ctx.prisma.user.findMany({ orderBy: { id: "asc" } });
}

export function getUserById(id: number, ctx: AppContext) {
  return ctx.prisma.user.findUnique({ where: { id } });
}

export function createUser(data: Prisma.UserUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.user.create({ data });
}

export function updateUser(id: number, data: Prisma.UserUncheckedUpdateInput, ctx: AppContext) {
  return ctx.prisma.user.update({ where: { id }, data });
}

export function deleteUser(id: number, ctx: AppContext) {
  return ctx.prisma.user.delete({ where: { id } });
}

export async function getUserProfileSummary(
  profileUserId: number,
  viewerUserId: number,
  ctx: AppContext,
): Promise<UserProfileSummary | null> {
  const profileUser = await ctx.prisma.user.findUnique({
    where: { id: profileUserId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  });

  if (!profileUser) {
    return null;
  }

  const [followerCount, followingCount, projectCount, projects, followRelation] =
    await Promise.all([
      ctx.prisma.follow.count({ where: { followingId: profileUserId } }),
      ctx.prisma.follow.count({ where: { followerId: profileUserId } }),
      ctx.prisma.project.count({ where: { userId: profileUserId } }),
      ctx.prisma.project.findMany({
        where: { userId: profileUserId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          quiz: {
            select: {
              id: true,
            },
          },
          deck: {
            select: {
              id: true,
            },
          },
        },
      }),
      profileUserId === viewerUserId
        ? Promise.resolve(null)
        : ctx.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerUserId,
                followingId: profileUserId,
              },
            },
            select: { followerId: true },
          }),
    ]);

  return {
    user: profileUser,
    stats: {
      followerCount,
      followingCount,
      projectCount,
    },
    isFollowing: Boolean(followRelation),
    projects: projects.map((project) => ({
      id: project.id,
      type: project.type,
      title: project.title,
      views: project.views,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      quizId: project.quiz?.id ?? null,
      deckId: project.deck?.id ?? null,
    })),
  };
}

