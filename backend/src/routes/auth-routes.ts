import { unlink } from "node:fs/promises";
import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  changeCurrentAuthUserPassword,
  getCurrentAuthUser,
  loginUser,
  registerUser,
  updateCurrentAuthUserAvatar,
  updateCurrentAuthUserProfile,
} from "../lib/auth-lib.js";
import { getAuthUserId, requireAuth } from "../middleware/auth.js";
import {
  avatarUploadSingle,
  resolveAvatarAbsolutePath,
  toPublicAvatarUrl,
} from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { optionalString, requireString } from "../utils/http.js";

export function createAuthRouter(ctx: AppContext) {
  const authRouter = Router();

  authRouter.post(
    "/register",
    asyncHandler(async (req, res) => {
      const email = requireString(req.body.email, "email");
      const username = requireString(req.body.username, "username");
      const password = requireString(req.body.password, "password");

      const result = await registerUser(
        {
          email,
          username,
          password,
        },
        ctx,
      );

      console.info("[auth] Account created", {
        userId: result.user.id,
        email: result.user.email,
        username: result.user.username,
        ip: req.ip,
      });

      res.status(201).json(result);
    }),
  );

  authRouter.post(
    "/login",
    asyncHandler(async (req, res) => {
      const email = requireString(req.body.email, "email");
      const password = requireString(req.body.password, "password");

      const result = await loginUser(
        {
          email,
          password,
        },
        ctx,
      );

      console.info("[auth] User logged in", {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
      });

      res.json(result);
    }),
  );

  authRouter.get(
    "/me",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const userId = getAuthUserId(res);
      const user = await getCurrentAuthUser(userId, ctx);
      res.json({ user });
    }),
  );

  authRouter.patch(
    "/me/profile",
    requireAuth,
    asyncHandler(async (req, res) => {
      const userId = getAuthUserId(res);
      const username = optionalString(req.body.username, "username");

      const user = await updateCurrentAuthUserProfile(
        userId,
        {
          username,
        },
        ctx,
      );

      res.json({ user });
    }),
  );

  authRouter.patch(
    "/me/password",
    requireAuth,
    asyncHandler(async (req, res) => {
      const userId = getAuthUserId(res);
      const currentPassword = requireString(req.body.currentPassword, "currentPassword");
      const newPassword = requireString(req.body.newPassword, "newPassword");

      await changeCurrentAuthUserPassword(
        userId,
        {
          currentPassword,
          newPassword,
        },
        ctx,
      );

      res.json({ success: true });
    }),
  );

  authRouter.post(
    "/me/avatar",
    requireAuth,
    avatarUploadSingle,
    asyncHandler(async (req, res) => {
      const userId = getAuthUserId(res);

      if (!req.file) {
        throw new ApiError(400, "Avatar image is required");
      }

      const currentUser = await getCurrentAuthUser(userId, ctx);
      const user = await updateCurrentAuthUserAvatar(
        userId,
        toPublicAvatarUrl(req.file.filename),
        ctx,
      );

      if (currentUser.avatarUrl) {
        const previousAbsolutePath = resolveAvatarAbsolutePath(currentUser.avatarUrl);

        if (previousAbsolutePath && previousAbsolutePath !== req.file.path) {
          void unlink(previousAbsolutePath).catch(() => undefined);
        }
      }

      res.json({ user });
    }),
  );

  return authRouter;
}