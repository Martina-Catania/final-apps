import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createUser, deleteUser, getUserById, listUsers, updateUser } from "../../../src/lib/user-lib.js";

function createCtx() {
  const user = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { user } } as unknown as AppContext;
  return { ctx, user };
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
});