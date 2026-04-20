import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  getUserProfileSummary,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../lib/user-lib.js";
import {
  createFollow,
  deleteFollow,
  getFollow,
} from "../lib/follow-lib.js";
import { getAuthUserId, requireAuth } from "../middleware/auth.js";
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
    "/:id/profile",
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const viewerUserId = getAuthUserId(res);

      const profile = await getUserProfileSummary(id, viewerUserId, ctx);
      if (!profile) {
        throw new ApiError(404, "User not found");
      }

      res.json(profile);
    }),
  );

  userRouter.post(
    "/:id/follow",
    requireAuth,
    asyncHandler(async (req, res) => {
      const followingId = parseIntParam(req.params.id, "id");
      const followerId = getAuthUserId(res);

      if (followerId === followingId) {
        throw new ApiError(400, "Users cannot follow themselves");
      }

      const targetUser = await getUserById(followingId, ctx);
      if (!targetUser) {
        throw new ApiError(404, "User not found");
      }

      const existingFollow = await getFollow(followerId, followingId, ctx);
      if (existingFollow) {
        res.json(existingFollow);
        return;
      }

      const follow = await createFollow({ followerId, followingId }, ctx);
      res.status(201).json(follow);
    }),
  );

  userRouter.delete(
    "/:id/follow",
    requireAuth,
    asyncHandler(async (req, res) => {
      const followingId = parseIntParam(req.params.id, "id");
      const followerId = getAuthUserId(res);

      if (followerId === followingId) {
        throw new ApiError(400, "Users cannot unfollow themselves");
      }

      const existingFollow = await getFollow(followerId, followingId, ctx);
      if (!existingFollow) {
        throw new ApiError(404, "Follow relation not found");
      }

      const follow = await deleteFollow(followerId, followingId, ctx);
      res.json(follow);
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

      const user = await createUser(
        {
          email,
          username,
          hashedPassword,
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

