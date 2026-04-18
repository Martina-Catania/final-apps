import { Platform } from "react-native";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  name: string;
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
  name?: string;
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

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${defaultHost}:3000/api`;

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

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