import {
  fetchWithTimeout,
  getApiBaseUrl,
  getApiConnectivityErrorMessage,
} from "./api-config";

type ErrorResponse = {
  error?: string;
  details?: unknown;
};

const API_BASE_URL = getApiBaseUrl();

export class ApiRequestError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function requestJson<T>(
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
    throw new ApiRequestError(getApiConnectivityErrorMessage(API_BASE_URL, error), 0, {
      apiBaseUrl: API_BASE_URL,
      reason: error instanceof Error ? error.message : "Unknown network error",
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const body = hasJsonBody ? ((await response.json()) as ErrorResponse) : undefined;

  if (!response.ok) {
    const message = body?.error ?? `Request failed (${response.status})`;
    throw new ApiRequestError(message, response.status, body?.details);
  }

  return body as T;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
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