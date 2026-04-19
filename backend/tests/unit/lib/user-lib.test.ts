import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import {
  createUser,
  deleteUser,
  getUserById,
  getUserProfileSummary,
  listUsers,
  updateUser,
} from "../../../src/lib/user-lib.js";

function createCtx() {
  const user = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const follow = {
    count: jest.fn(),
    findUnique: jest.fn(),
  };

  const project = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const ctx = { prisma: { user, follow, project } } as unknown as AppContext;
  return { ctx, user, follow, project };
}

describe("user-lib", () => {
  it("lists users", () => {
    const { ctx, user } = createCtx();
    listUsers(ctx);

    expect(user.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
    });
  });

  it("gets user by id", () => {
    const { ctx, user } = createCtx();
    getUserById(2, ctx);

    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
    });
  });

  it("creates user", () => {
    const { ctx, user } = createCtx();
    const data = { email: "user@example.com", username: "user", hashedPassword: "hash" };
    createUser(data as never, ctx);

    expect(user.create).toHaveBeenCalledWith({ data });
  });

  it("updates user", () => {
    const { ctx, user } = createCtx();
    const data = { username: "updated" };
    updateUser(2, data as never, ctx);

    expect(user.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data,
    });
  });

  it("deletes user", () => {
    const { ctx, user } = createCtx();
    deleteUser(2, ctx);

    expect(user.delete).toHaveBeenCalledWith({
      where: { id: 2 },
    });
  });

  it("returns aggregated user profile summary", async () => {
    const { ctx, user, follow, project } = createCtx();

    user.findUnique.mockResolvedValue({
      id: 9,
      username: "profile_user",
      avatarUrl: "/uploads/avatars/avatar.jpg",
    } as never);
    follow.count.mockResolvedValueOnce(4 as never).mockResolvedValueOnce(7 as never);
    project.count.mockResolvedValue(3 as never);
    project.findMany.mockResolvedValue([
      {
        id: 11,
        type: "QUIZ",
        title: "Biology Basics",
        timesPlayed: 19,
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        quiz: { id: 22 },
        deck: null,
      },
      {
        id: 12,
        type: "DECK",
        title: "Chemistry Cards",
        timesPlayed: 8,
        createdAt: new Date("2026-04-11T10:00:00.000Z"),
        updatedAt: new Date("2026-04-11T10:00:00.000Z"),
        quiz: null,
        deck: { id: 31 },
      },
    ] as never);
    follow.findUnique.mockResolvedValue({ followerId: 7 } as never);

    const result = await getUserProfileSummary(9, 7, ctx);

    expect(result).toEqual({
      user: {
        id: 9,
        username: "profile_user",
        avatarUrl: "/uploads/avatars/avatar.jpg",
      },
      stats: {
        followerCount: 4,
        followingCount: 7,
        projectCount: 3,
      },
      isFollowing: true,
      projects: [
        {
          id: 11,
          type: "QUIZ",
          title: "Biology Basics",
          timesPlayed: 19,
          createdAt: new Date("2026-04-10T10:00:00.000Z"),
          updatedAt: new Date("2026-04-10T10:00:00.000Z"),
          quizId: 22,
          deckId: null,
        },
        {
          id: 12,
          type: "DECK",
          title: "Chemistry Cards",
          timesPlayed: 8,
          createdAt: new Date("2026-04-11T10:00:00.000Z"),
          updatedAt: new Date("2026-04-11T10:00:00.000Z"),
          quizId: null,
          deckId: 31,
        },
      ],
    });
  });

  it("returns null when profile user does not exist", async () => {
    const { ctx, user, follow, project } = createCtx();
    user.findUnique.mockResolvedValue(null as never);

    const result = await getUserProfileSummary(999, 1, ctx);

    expect(result).toBeNull();
    expect(follow.count).not.toHaveBeenCalled();
    expect(project.count).not.toHaveBeenCalled();
  });
});