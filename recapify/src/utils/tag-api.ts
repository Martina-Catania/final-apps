import { requestJson } from "./api-request";
import type { ProjectTag } from "./project-api";

export type Tag = {
  id: number;
  name: string;
};

export function listTagsRequest(token?: string) {
  return requestJson<Tag[]>(
    "/tags",
    {
      method: "GET",
    },
    token,
  );
}

export function createTagRequest(name: string, token?: string) {
  return requestJson<Tag>(
    "/tags",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
    token,
  );
}

export function addTagToProjectRequest(projectId: number, tagId: number, token?: string) {
  return requestJson<ProjectTag>(
    `/projects/${projectId}/tags/${tagId}`,
    {
      method: "POST",
    },
    token,
  );
}

export function listProjectTagsRequest(projectId: number, token?: string) {
  return requestJson<ProjectTag[]>(
    `/projects/${projectId}/tags`,
    {
      method: "GET",
    },
    token,
  );
}
