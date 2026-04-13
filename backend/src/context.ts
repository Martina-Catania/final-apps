import type { PrismaClient } from "../generated/prisma/index.js";
import { prisma } from "./prisma.js";

export type AppContext = {
  prisma: PrismaClient;
};

export const defaultAppContext: AppContext = {
  prisma,
};
