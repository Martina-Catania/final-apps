import { requestJson } from "./api-request";
import type { Project } from "./project-api";

export type SummaryFile = {
  id: number;
  summaryId: number;
  filename: string;
};

export type Summary = {
  id: number;
  projectId: number;
  project: Project;
  content: string;
  files: SummaryFile[];
};

export type CreateSummaryInput = {
  projectId: number;
  content: string;
};

export type UpdateSummaryInput = {
  projectId?: number;
  content?: string;
};

export function listSummariesRequest(token?: string) {
  return requestJson<Summary[]>(
    "/summaries",
    {
      method: "GET",
    },
    token,
  );
}

export function getSummaryByIdRequest(summaryId: number, token?: string) {
  return requestJson<Summary>(
    `/summaries/${summaryId}`,
    {
      method: "GET",
    },
    token,
  );
}

export function createSummaryRequest(input: CreateSummaryInput, token?: string) {
  return requestJson<Summary>(
    "/summaries",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateSummaryRequest(
  summaryId: number,
  input: UpdateSummaryInput,
  token?: string,
) {
  return requestJson<Summary>(
    `/summaries/${summaryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteSummaryRequest(summaryId: number, token?: string) {
  return requestJson<Summary>(
    `/summaries/${summaryId}`,
    {
      method: "DELETE",
    },
    token,
  );
}
