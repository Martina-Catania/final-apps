import { ProjectType } from "../../generated/prisma/index.js";
import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createQuiz,
  deleteQuiz,
  getQuizById,
  listQuizzes,
  updateQuiz,
} from "../lib/quiz-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { parseIntParam, requireInt } from "../utils/http.js";

export function createQuizRouter(ctx: AppContext) {
  const quizRouter = Router();

  quizRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const quizzes = await listQuizzes(ctx);
      res.json(quizzes);
    }),
  );

  quizRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const quiz = await getQuizById(id, ctx);

      if (!quiz) {
        throw new ApiError(404, "Quiz not found");
      }

      res.json(quiz);
    }),
  );

  quizRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const projectId = requireInt(req.body.projectId, "projectId");

      const project = await ctx.prisma.project.findUnique({
        where: { id: projectId },
        select: { type: true },
      });

      if (!project) {
        throw new ApiError(404, "Project not found");
      }

      if (project.type !== ProjectType.QUIZ) {
        throw new ApiError(400, "Project type must be QUIZ");
      }

      const quiz = await createQuiz({ projectId }, ctx);
      res.status(201).json(quiz);
    }),
  );

  quizRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const quiz = await updateQuiz(
        id,
        {
          projectId: typeof req.body.projectId === "number" ? requireInt(req.body.projectId, "projectId") : undefined,
        },
        ctx,
      );

      res.json(quiz);
    }),
  );

  quizRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const quiz = await deleteQuiz(id, ctx);
      res.json(quiz);
    }),
  );

  return quizRouter;
}

