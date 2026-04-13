import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createFollow, deleteFollow, getFollow, listFollows } from "../../../src/lib/follow-lib.js";

function createCtx() {
  const follow = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { follow } } as unknown as AppContext;
  return { ctx, follow };
}

describe("follow-lib", () => {
  it("lists follows", () => {
    const { ctx, follow } = createCtx();
    listFollows(ctx);

    expect(follow.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: { follower: true, following: true },
    });
  });

  it("gets follow by composite key", () => {
    const { ctx, follow } = createCtx();
    getFollow(10, 11, ctx);

    expect(follow.findUnique).toHaveBeenCalledWith({
      where: {
        followerId_followingId: {
          followerId: 10,
          followingId: 11,
        },
      },
      include: { follower: true, following: true },
    });
  });

  it("creates follow", () => {
    const { ctx, follow } = createCtx();
    const data = { followerId: 5, followingId: 6 };
    createFollow(data as never, ctx);

    expect(follow.create).toHaveBeenCalledWith({
      data,
      include: { follower: true, following: true },
    });
  });

  it("deletes follow by composite key", () => {
    const { ctx, follow } = createCtx();
    deleteFollow(5, 6, ctx);

    expect(follow.delete).toHaveBeenCalledWith({
      where: {
        followerId_followingId: {
          followerId: 5,
          followingId: 6,
        },
      },
      include: { follower: true, following: true },
    });
  });
});