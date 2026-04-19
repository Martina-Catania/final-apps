import { requestJson } from "./api-request";
import type { Project } from "./project-api";

export type QuizQuestion = {
  id: number;
  quizId: number;
  question: string;
  answer: string;
  decoy1: string;
  decoy2: string;
  decoy3: string;
};

export type Quiz = {
  id: number;
  projectId: number;
  project: Project;
  questions: QuizQuestion[];
};

export type CreateQuizQuestionInput = {
  quizId: number;
  question: string;
  answer: string;
  decoy1: string;
  decoy2: string;
  decoy3: string;
};

export type UpdateQuizQuestionInput = {
  quizId?: number;
  question?: string;
  answer?: string;
  decoy1?: string;
  decoy2?: string;
  decoy3?: string;
};

export function createQuizRequest(projectId: number, token?: string) {
  return requestJson<Quiz>(
    "/quizzes",
    {
      method: "POST",
      body: JSON.stringify({ projectId }),
    },
    token,
  );
}

export function listQuizzesRequest(token?: string) {
  return requestJson<Quiz[]>(
    "/quizzes",
    {
      method: "GET",
    },
    token,
  );
}

export function createQuizQuestionRequest(
  input: CreateQuizQuestionInput,
  token?: string,
) {
  return requestJson<QuizQuestion>(
    "/quiz-questions",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function getQuizByIdRequest(quizId: number, token?: string) {
  return requestJson<Quiz>(
    `/quizzes/${quizId}`,
    {
      method: "GET",
    },
    token,
  );
}

export function updateQuizQuestionRequest(
  questionId: number,
  input: UpdateQuizQuestionInput,
  token?: string,
) {
  return requestJson<QuizQuestion>(
    `/quiz-questions/${questionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteQuizQuestionRequest(questionId: number, token?: string) {
  return requestJson<QuizQuestion>(
    `/quiz-questions/${questionId}`,
    {
      method: "DELETE",
    },
    token,
  );
}
