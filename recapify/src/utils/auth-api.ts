import { requestJson } from "./api-request";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
};

export type AuthPayload = {
  user: AuthUser;
  token: string;
};

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

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