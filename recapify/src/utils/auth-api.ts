import {
  fetchWithTimeout,
  getApiBaseUrl,
  getApiConnectivityErrorMessage,
} from "./api-config";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  timetable: string | null;
};

export type AuthPayload = {
  user: AuthUser;
  token: string;
};

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
  timetable?: string;
};

export class AuthApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

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
    throw new AuthApiError(getApiConnectivityErrorMessage(API_BASE_URL, error), 0, {
      apiBaseUrl: API_BASE_URL,
      reason: error instanceof Error ? error.message : "Unknown network error",
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const body = hasJsonBody
    ? ((await response.json()) as {
        error?: string;
        details?: unknown;
      })
    : undefined;

  if (!response.ok) {
    const message = body?.error ?? `Request failed (${response.status})`;
    throw new AuthApiError(message, response.status, body?.details);
  }

  return body as T;
}

export function registerRequest(input: RegisterInput) {
  return requestJson<AuthPayload>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function loginRequest(email: string, password: string) {
  return requestJson<AuthPayload>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

export function currentUserRequest(token: string) {
  return requestJson<{ user: AuthUser }>(
    "/auth/me",
    {
      method: "GET",
    },
    token,
  );
}