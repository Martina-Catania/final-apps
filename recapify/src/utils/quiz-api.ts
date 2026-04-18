import {
  fetchWithTimeout,
  getApiBaseUrl,
  getApiConnectivityErrorMessage,
} from "./api-config";

export type ProjectType = "SUMMARY" | "QUIZ" | "DECK";

export type ProjectCreator = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

export type Project = {
  id: number;
  type: ProjectType;
  title: string;
  userId: number;
  user?: ProjectCreator;
  views: number;
  createdAt: string;
  updatedAt: string;
};

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

export type CreateQuizProjectInput = {
  title: string;
  userId: number;
};

export type CreateQuizQuestionInput = {
  quizId: number;
  question: string;
  answer: string;
  decoy1: string;
  decoy2: string;
  decoy3: string;
};

export type UpdateProjectInput = {
  title?: string;
  type?: ProjectType;
  userId?: number;
};

export type UpdateQuizQuestionInput = {
  quizId?: number;
  question?: string;
  answer?: string;
  decoy1?: string;
  decoy2?: string;
  decoy3?: string;
};

export class QuizApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "QuizApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

type ErrorResponse = {
  error?: string;
  details?: unknown;
};

const API_BASE_URL = getApiBaseUrl();

async function requestJson<T>(
  path: string,
  init: RequestInit,
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? undefined);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new QuizApiError(getApiConnectivityErrorMessage(API_BASE_URL, error), 0, {
      apiBaseUrl: API_BASE_URL,
      reason: error instanceof Error ? error.message : "Unknown network error",
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const body = hasJsonBody ? ((await response.json()) as ErrorResponse) : undefined;

  if (!response.ok) {
    const message = body?.error ?? `Request failed (${response.status})`;
    throw new QuizApiError(message, response.status, body?.details);
  }

  return body as T;
}

export function createQuizProjectRequest(
  input: CreateQuizProjectInput,
  token?: string,
) {
  return requestJson<Project>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        type: "QUIZ",
        title: input.title,
        userId: input.userId,
      }),
    },
    token,
  );
}

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

export function updateProjectRequest(
  projectId: number,
  input: UpdateProjectInput,
  token?: string,
) {
  return requestJson<Project>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
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

export function getQuizApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof QuizApiError) {
    if (
      error.details &&
      typeof error.details === "object" &&
      "errors" in error.details &&
      Array.isArray(error.details.errors)
    ) {
      const message = error.details.errors
        .filter((item): item is string => typeof item === "string")
        .join(". ");

      if (message) {
        return message;
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
