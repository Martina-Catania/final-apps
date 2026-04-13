import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../lib/user-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { optionalString, parseIntParam, requireString } from "../utils/http.js";

export function createUserRouter(ctx: AppContext) {
  const userRouter = Router();

  userRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const users = await listUsers(ctx);
      res.json(users);
    }),
  );

  userRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const user = await getUserById(id, ctx);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      res.json(user);
    }),
  );

  userRouter.get(
    "/:id/followers",
    asyncHandler(async (req, res) => {
      const userId = parseIntParam(req.params.id, "id");
      const followers = await ctx.prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(followers);
    }),
  );

  userRouter.get(
    "/:id/following",
    asyncHandler(async (req, res) => {
      const userId = parseIntParam(req.params.id, "id");
      const following = await ctx.prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(following);
    }),
  );

  userRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const email = requireString(req.body.email, "email");
      const username = requireString(req.body.username, "username");
      const hashedPassword = requireString(req.body.hashedPassword, "hashedPassword");
      const name = optionalString(req.body.name, "name") ?? "";
      const timetable = optionalString(req.body.timetable, "timetable");

      const user = await createUser(
        {
          email,
          username,
          hashedPassword,
          name,
          timetable,
        },
        ctx,
      );

      res.status(201).json(user);
    }),
  );

  userRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");

      const user = await updateUser(
        id,
        {
          email: optionalString(req.body.email, "email"),
          username: optionalString(req.body.username, "username"),
          hashedPassword: optionalString(req.body.hashedPassword, "hashedPassword"),
          name: optionalString(req.body.name, "name"),
          timetable: optionalString(req.body.timetable, "timetable"),
        },
        ctx,
      );

      res.json(user);
    }),
  );

  userRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const user = await deleteUser(id, ctx);
      res.json(user);
    }),
  );

  return userRouter;
}

