import { Router } from "express";
import type { AppContext } from "../context.js";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  getQuizQuestionById,
  listQuizQuestions,
  updateQuizQuestion,
} from "../lib/quiz-question-lib.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import {
  optionalString,
  parseIntParam,
  requireInt,
  requireString,
} from "../utils/http.js";

export function createQuizQuestionRouter(ctx: AppContext) {
  const quizQuestionRouter = Router();

  quizQuestionRouter.get(
    "/",
    asyncHandler(async (_req, res) => {
      const questions = await listQuizQuestions(ctx);
      res.json(questions);
    }),
  );

  quizQuestionRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const question = await getQuizQuestionById(id, ctx);

      if (!question) {
        throw new ApiError(404, "Quiz question not found");
      }

      res.json(question);
    }),
  );

  quizQuestionRouter.post(
    "/",
    asyncHandler(async (req, res) => {
      const quizId = requireInt(req.body.quizId, "quizId");
      const question = requireString(req.body.question, "question");
      const answer = requireString(req.body.answer, "answer");
      const decoy1 = requireString(req.body.decoy1, "decoy1");
      const decoy2 = requireString(req.body.decoy2, "decoy2");
      const decoy3 = requireString(req.body.decoy3, "decoy3");

      const item = await createQuizQuestion(
        {
          quizId,
          question,
          answer,
          decoy1,
          decoy2,
          decoy3,
        },
        ctx,
      );

      res.status(201).json(item);
    }),
  );

  quizQuestionRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");

      const item = await updateQuizQuestion(
        id,
        {
          quizId: typeof req.body.quizId === "number" ? requireInt(req.body.quizId, "quizId") : undefined,
          question: optionalString(req.body.question, "question"),
          answer: optionalString(req.body.answer, "answer"),
          decoy1: optionalString(req.body.decoy1, "decoy1"),
          decoy2: optionalString(req.body.decoy2, "decoy2"),
          decoy3: optionalString(req.body.decoy3, "decoy3"),
        },
        ctx,
      );

      res.json(item);
    }),
  );

  quizQuestionRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = parseIntParam(req.params.id, "id");
      const question = await deleteQuizQuestion(id, ctx);
      res.json(question);
    }),
  );

  return quizQuestionRouter;
}

