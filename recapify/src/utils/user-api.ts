import { Platform } from "react-native";
import {
  ApiRequestError,
  getApiErrorMessage,
  requestJson,
} from "./api-request";
import type { AuthUser } from "./auth-api";
import type { ProjectTag, ProjectType } from "./project-api";

export type ProfileUser = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

export type ProfileProject = {
  id: number;
  type: ProjectType;
  title: string;
  timesPlayed: number;
  createdAt: string;
  updatedAt: string;
  quizId: number | null;
  summaryId: number | null;
  deckId: number | null;
  tags: ProjectTag[];
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

const AVATAR_UPLOAD_TIMEOUT_MS = 30_000;
const AVATAR_UPLOAD_MAX_ATTEMPTS = 2;
const AVATAR_UPLOAD_RETRY_DELAY_MS = 350;

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
        {
          includeJsonContentType: false,
          timeoutMs: AVATAR_UPLOAD_TIMEOUT_MS,
        },
      );
    } catch (error) {
      const isTransientConnectivityFailure =
        error instanceof ApiRequestError && error.statusCode === 0;

      if (!isTransientConnectivityFailure || attempt >= AVATAR_UPLOAD_MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, AVATAR_UPLOAD_RETRY_DELAY_MS);
      });
    }
  }

  throw new ApiRequestError("Unable to upload avatar", 0);
}

export function getUserApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}
