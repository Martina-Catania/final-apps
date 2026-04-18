import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createFollow,
  deleteFollow,
  getFollow,
  listFollows,
} from "../lib/follow-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { parseIntParam, requireInt } from "../utils/http.js";

export function createFollowRouter(ctx: AppContext) {
  const followRouter = Router();

  followRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const follows = await listFollows(ctx);
      res.json(follows);
    }),
  );

  followRouter.get(
    "/:followerId/:followingId",
    asyncHandler(async (req, res) => {
      const followerId = parseIntParam(req.params.followerId, "followerId");
      const followingId = parseIntParam(req.params.followingId, "followingId");

      const follow = await getFollow(followerId, followingId, ctx);
      if (!follow) {
        throw new ApiError(404, "Follow relation not found");
      }

      res.json(follow);
    }),
  );

  followRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const followerId = requireInt(req.body.followerId, "followerId");
      const followingId = requireInt(req.body.followingId, "followingId");

      if (followerId === followingId) {
        throw new ApiError(400, "Users cannot follow themselves");
      }

      const follow = await createFollow({ followerId, followingId }, ctx);

      console.info("[follow] User followed another user", {
        followerId: follow.followerId,
        followingId: follow.followingId,
        ip: req.ip,
      });

      res.status(201).json(follow);
    }),
  );

  followRouter.delete(
    "/:followerId/:followingId",
    asyncHandler(async (req, res) => {
      const followerId = parseIntParam(req.params.followerId, "followerId");
      const followingId = parseIntParam(req.params.followingId, "followingId");
      const follow = await deleteFollow(followerId, followingId, ctx);
      res.json(follow);
    }),
  );

  return followRouter;
}

