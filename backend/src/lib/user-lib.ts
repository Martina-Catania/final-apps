import type { Prisma } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

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

