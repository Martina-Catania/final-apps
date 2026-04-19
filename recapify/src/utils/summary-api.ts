import { Platform } from "react-native";
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

export type UploadSummaryFileInput = {
  summaryId: number;
  uri: string;
  name: string;
  mimeType?: string;
  webFile?: Blob;
};

export type UpdateSummaryInput = {
  projectId?: number;
  content?: string;
};

const SUMMARY_FILE_UPLOAD_TIMEOUT_MS = 30_000;

function inferSummaryFileMimeType(filename: string) {
  const normalizedName = filename.toLowerCase();

  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedName.endsWith(".doc")) {
    return "application/msword";
  }

  if (normalizedName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "application/octet-stream";
}

async function buildSummaryFileFormData(input: UploadSummaryFileInput) {
  const formData = new FormData();
  formData.append("summaryId", String(input.summaryId));

  const fallbackMimeType = inferSummaryFileMimeType(input.name);

  if (Platform.OS === "web") {
    let webFile = input.webFile;

    if (!webFile) {
      const response = await fetch(input.uri);
      webFile = await response.blob();
    }

    const mimeType = input.mimeType ?? webFile.type ?? fallbackMimeType;
    const normalizedWebFile = webFile.type === mimeType
      ? webFile
      : webFile.slice(0, webFile.size, mimeType);

    formData.append("file", normalizedWebFile, input.name);
    return formData;
  }

  const nativeFilePart = {
    uri: input.uri,
    name: input.name,
    type: input.mimeType ?? fallbackMimeType,
  } as unknown as Blob;

  formData.append("file", nativeFilePart);
  return formData;
}

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

export async function uploadSummaryFileRequest(input: UploadSummaryFileInput, token?: string) {
  const formData = await buildSummaryFileFormData(input);

  return requestJson<SummaryFile>(
    "/summary-files",
    {
      method: "POST",
      body: formData,
    },
    token,
    {
      includeJsonContentType: false,
      timeoutMs: SUMMARY_FILE_UPLOAD_TIMEOUT_MS,
    },
  );
}
