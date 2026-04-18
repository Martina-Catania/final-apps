import { Router } from "express";
import type { AppContext } from "../context.js";
import { getCurrentAuthUser, loginUser, registerUser } from "../lib/auth-lib.js";
import { getAuthUserId, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { optionalString, requireString } from "../utils/http.js";

export function createAuthRouter(ctx: AppContext) {
  const authRouter = Router();

  authRouter.post(
    "/register",
    asyncHandler(async (req, res) => {
      const email = requireString(req.body.email, "email");
      const username = requireString(req.body.username, "username");
      const password = requireString(req.body.password, "password");
      const name = optionalString(req.body.name, "name");
      const timetable = optionalString(req.body.timetable, "timetable");

      const result = await registerUser(
        {
          email,
          username,
          password,
          name,
          timetable,
        },
        ctx,
      );

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

  return authRouter;
}