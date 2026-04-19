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
  timesPlayed: number;
  createdAt: string;
  updatedAt: string;
};

export type FollowingProject = Project & {
  quiz: { id: number } | null;
  deck: { id: number } | null;
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

export function incrementProjectTimesPlayedRequest(projectId: number, token?: string) {
  return requestJson<Project>(
    `/projects/${projectId}/times-played/increment`,
    {
      method: "POST",
    },
    token,
  );
}

export function deleteProjectRequest(projectId: number, token?: string) {
  return requestJson<Project>(
    `/projects/${projectId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function listFollowingProjectsRequest(token: string) {
  return requestJson<FollowingProject[]>(
    "/projects/following",
    {
      method: "GET",
    },
    token,
  );
}
