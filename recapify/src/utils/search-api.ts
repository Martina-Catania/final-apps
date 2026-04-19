import type { ProjectType } from "./project-api";
import { requestJson } from "./api-request";

export type SearchPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SearchUser = {
  id: number;
  username: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  projectCount: number;
};

export type SearchProject = {
  id: number;
  type: ProjectType;
  title: string;
  timesPlayed: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  quizId: number | null;
  deckId: number | null;
  tags: {
    id: number;
    name: string;
  }[];
};

export type SearchResponse = {
  query: string;
  users: SearchUser[];
  projects: SearchProject[];
  usersPagination: SearchPagination;
  projectsPagination: SearchPagination;
};

export type SearchRequestInput = {
  query?: string;
  tagIds?: number[];
  usersPage?: number;
  usersLimit?: number;
  projectsPage?: number;
  projectsLimit?: number;
};

function addQueryParam(params: URLSearchParams, key: string, value: number | undefined) {
  if (typeof value === "number") {
    params.set(key, String(value));
  }
}

function addListQueryParam(params: URLSearchParams, key: string, values: number[] | undefined) {
  if (!Array.isArray(values)) {
    return;
  }

  const uniqueValues = [...new Set(values.filter((value) => Number.isInteger(value) && value > 0))];

  for (const value of uniqueValues) {
    params.append(key, String(value));
  }
}

export function searchRequest(input: SearchRequestInput, token: string) {
  const params = new URLSearchParams();

  const trimmedQuery = input.query?.trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  addListQueryParam(params, "tagIds", input.tagIds);

  addQueryParam(params, "usersPage", input.usersPage);
  addQueryParam(params, "usersLimit", input.usersLimit);
  addQueryParam(params, "projectsPage", input.projectsPage);
  addQueryParam(params, "projectsLimit", input.projectsLimit);

  return requestJson<SearchResponse>(
    `/search?${params.toString()}`,
    {
      method: "GET",
    },
    token,
  );
}