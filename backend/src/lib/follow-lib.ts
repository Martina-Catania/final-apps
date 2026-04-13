import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

const followInclude = {
  follower: true,
  following: true,
};

export function listFollows(ctx: AppContext) {
  return ctx.prisma.follow.findMany({ orderBy: { createdAt: "desc" }, include: followInclude });
}

export function getFollow(followerId: number, followingId: number, ctx: AppContext) {
  return ctx.prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    include: followInclude,
  });
}

export function createFollow(data: Prisma.FollowUncheckedCreateInput, ctx: AppContext) {
  return ctx.prisma.follow.create({ data, include: followInclude });
}

export function deleteFollow(followerId: number, followingId: number, ctx: AppContext) {
  return ctx.prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    include: followInclude,
  });
}

