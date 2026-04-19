import { requestJson } from "./api-request";

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

export type CreateProjectInput = {
  type: ProjectType;
  title: string;
  userId: number;
};

export type UpdateProjectInput = {
  title?: string;
  type?: ProjectType;
  userId?: number;
};

export function createProjectRequest(input: CreateProjectInput, token?: string) {
  return requestJson<Project>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(input),
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

export function incrementProjectViewsRequest(projectId: number, token?: string) {
  return requestJson<Project>(
    `/projects/${projectId}/views/increment`,
    {
      method: "POST",
    },
    token,
  );
}
