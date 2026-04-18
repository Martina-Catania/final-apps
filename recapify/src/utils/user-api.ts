import { Platform } from "react-native";
import type { AuthUser } from "./auth-api";
import type { ProjectType } from "./quiz-api";

export type ProfileUser = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
};

export type ProfileProject = {
  id: number;
  type: ProjectType;
  title: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  quizId: number | null;
};

export type UserProfileSummary = {
  user: ProfileUser;
  stats: {
    followerCount: number;
    followingCount: number;
    projectCount: number;
  };
  isFollowing: boolean;
  projects: ProfileProject[];
};

export type UpdateCurrentUserProfileInput = {
  name?: string;
  username?: string;
};

export type UpdateCurrentUserPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type UploadAvatarInput = {
  uri: string;
  name: string;
  mimeType?: string;
};

type ErrorResponse = {
  error?: string;
  details?: unknown;
};

export class UserApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "UserApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${defaultHost}:3000/api`;

async function requestJson<T>(
  path: string,
  init: RequestInit,
  token?: string,
  includeJsonContentType = true,
): Promise<T> {
  const headers = new Headers(init.headers ?? undefined);

  if (includeJsonContentType) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const body = hasJsonBody ? ((await response.json()) as ErrorResponse) : undefined;

  if (!response.ok) {
    const message = body?.error ?? `Request failed (${response.status})`;
    throw new UserApiError(message, response.status, body?.details);
  }

  return body as T;
}

export function getUserProfileRequest(userId: number, token: string) {
  return requestJson<UserProfileSummary>(
    `/users/${userId}/profile`,
    {
      method: "GET",
    },
    token,
  );
}

export function followUserRequest(userId: number, token: string) {
  return requestJson<unknown>(
    `/users/${userId}/follow`,
    {
      method: "POST",
    },
    token,
  );
}

export function unfollowUserRequest(userId: number, token: string) {
  return requestJson<unknown>(
    `/users/${userId}/follow`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function updateCurrentUserProfileRequest(
  input: UpdateCurrentUserProfileInput,
  token: string,
) {
  return requestJson<{ user: AuthUser }>(
    "/auth/me/profile",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateCurrentUserPasswordRequest(
  input: UpdateCurrentUserPasswordInput,
  token: string,
) {
  return requestJson<{ success: boolean }>(
    "/auth/me/password",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function uploadCurrentUserAvatarRequest(input: UploadAvatarInput, token: string) {
  const formData = new FormData();
  const filePart = {
    uri: input.uri,
    name: input.name,
    type: input.mimeType ?? "image/jpeg",
  } as unknown as Blob;

  formData.append("avatar", filePart);

  return requestJson<{ user: AuthUser }>(
    "/auth/me/avatar",
    {
      method: "POST",
      body: formData,
    },
    token,
    false,
  );
}

export function getUserApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof UserApiError) {
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
