import { Platform } from "react-native";
import {
  fetchWithTimeout,
  getApiBaseUrl,
  getApiConnectivityErrorMessage,
} from "./api-config";
import type { AuthUser } from "./auth-api";
import type { ProjectType } from "./project-api";

export type ProfileUser = {
  id: number;
  username: string;
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
  deckId: number | null;
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
  webFile?: Blob;
};

type ErrorResponse = {
  error?: string;
  details?: unknown;
};

type RequestJsonOptions = {
  timeoutMs?: number;
};

const AVATAR_UPLOAD_TIMEOUT_MS = 30_000;
const AVATAR_UPLOAD_MAX_ATTEMPTS = 2;
const AVATAR_UPLOAD_RETRY_DELAY_MS = 350;

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

const API_BASE_URL = getApiBaseUrl();

async function requestJson<T>(
  path: string,
  init: RequestInit,
  token?: string,
  includeJsonContentType = true,
  options?: RequestJsonOptions,
): Promise<T> {
  const headers = new Headers(init.headers ?? undefined);

  if (includeJsonContentType) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    }, {
      timeoutMs: options?.timeoutMs,
    });
  } catch (error) {
    throw new UserApiError(getApiConnectivityErrorMessage(API_BASE_URL, error), 0, {
      apiBaseUrl: API_BASE_URL,
      reason: error instanceof Error ? error.message : "Unknown network error",
    });
  }

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

async function buildAvatarFormData(input: UploadAvatarInput): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    let webFile = input.webFile;

    if (!webFile) {
      const response = await fetch(input.uri);
      webFile = await response.blob();
    }

    const mimeType = input.mimeType ?? webFile.type ?? "image/jpeg";
    const normalizedWebFile = webFile.type === mimeType
      ? webFile
      : webFile.slice(0, webFile.size, mimeType);

    formData.append("avatar", normalizedWebFile, input.name);
    return formData;
  }

  const nativeFilePart = {
    uri: input.uri,
    name: input.name,
    type: input.mimeType ?? "image/jpeg",
  } as unknown as Blob;

  formData.append("avatar", nativeFilePart);
  return formData;
}

export async function uploadCurrentUserAvatarRequest(input: UploadAvatarInput, token: string) {
  for (let attempt = 1; attempt <= AVATAR_UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    const formData = await buildAvatarFormData(input);

    try {
      return await requestJson<{ user: AuthUser }>(
        "/auth/me/avatar",
        {
          method: "POST",
          body: formData,
        },
        token,
        false,
        {
          timeoutMs: AVATAR_UPLOAD_TIMEOUT_MS,
        },
      );
    } catch (error) {
      const isTransientConnectivityFailure =
        error instanceof UserApiError && error.statusCode === 0;

      if (!isTransientConnectivityFailure || attempt >= AVATAR_UPLOAD_MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, AVATAR_UPLOAD_RETRY_DELAY_MS);
      });
    }
  }

  throw new UserApiError("Unable to upload avatar", 0);
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
