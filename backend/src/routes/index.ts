import { Router } from "express";
import type { AppContext } from "../context.js";
import { createDeckRouter } from "./deck-routes.js";
import { createFlashcardRouter } from "./flashcard-routes.js";
import { createFollowRouter } from "./follow-routes.js";
import { createProjectRouter } from "./project-routes.js";
import { createProjectTagRouter } from "./project-tag-routes.js";
import { createQuizRouter } from "./quiz-routes.js";
import { createQuizQuestionRouter } from "./quiz-question-routes.js";
import { createSummaryRouter } from "./summary-routes.js";
import { createSummaryFileRouter } from "./summary-file-routes.js";
import { createTagRouter } from "./tag-routes.js";
import { createUserRouter } from "./user-routes.js";

export function createApiRouter(ctx: AppContext) {
	const apiRouter = Router();

	apiRouter.use("/users", createUserRouter(ctx));
	apiRouter.use("/projects", createProjectRouter(ctx));
	apiRouter.use("/follows", createFollowRouter(ctx));
	apiRouter.use("/summaries", createSummaryRouter(ctx));
	apiRouter.use("/summary-files", createSummaryFileRouter(ctx));
	apiRouter.use("/quizzes", createQuizRouter(ctx));
	apiRouter.use("/quiz-questions", createQuizQuestionRouter(ctx));
	apiRouter.use("/decks", createDeckRouter(ctx));
	apiRouter.use("/flashcards", createFlashcardRouter(ctx));
	apiRouter.use("/tags", createTagRouter(ctx));
	apiRouter.use("/project-tags", createProjectTagRouter(ctx));

	return apiRouter;
}

