import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";
import { ApiError } from "../utils/api-error.js";

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_SUMMARY_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const AVATAR_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "avatars");
const SUMMARY_DOCUMENT_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "summary-files");
const PUBLIC_AVATAR_PATH_PREFIX = "/uploads/avatars/";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_SUMMARY_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function ensureAvatarUploadDir() {
  if (!existsSync(AVATAR_UPLOAD_DIR)) {
    mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
  }
}

function ensureSummaryDocumentUploadDir() {
  if (!existsSync(SUMMARY_DOCUMENT_UPLOAD_DIR)) {
    mkdirSync(SUMMARY_DOCUMENT_UPLOAD_DIR, { recursive: true });
  }
}

function getExtensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  if (mimeType === "image/gif") {
    return ".gif";
  }

  return "";
}

function getSummaryDocumentExtensionForMimeType(mimeType: string) {
  if (mimeType === "application/pdf") {
    return ".pdf";
  }

  if (mimeType === "application/msword") {
    return ".doc";
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return ".docx";
  }

  return "";
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureAvatarUploadDir();
    callback(null, AVATAR_UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const derivedExtension = getExtensionForMimeType(file.mimetype);
    const requestedExtension = path.extname(file.originalname).toLowerCase();

    const extension = derivedExtension || requestedExtension || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}${extension}`;

    callback(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: MAX_AVATAR_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(400, "Avatar must be a JPEG, PNG, WEBP, or GIF image"));
      return;
    }

    callback(null, true);
  },
});

const summaryDocumentStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureSummaryDocumentUploadDir();
    callback(null, SUMMARY_DOCUMENT_UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const derivedExtension = getSummaryDocumentExtensionForMimeType(file.mimetype);
    const requestedExtension = path.extname(file.originalname).toLowerCase();

    const extension = derivedExtension || requestedExtension || ".bin";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}${extension}`;

    callback(null, uniqueName);
  },
});

const summaryDocumentUpload = multer({
  storage: summaryDocumentStorage,
  limits: {
    fileSize: MAX_SUMMARY_DOCUMENT_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_SUMMARY_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(400, "Summary file must be a PDF, DOC, or DOCX document"));
      return;
    }

    callback(null, true);
  },
});

export const avatarUploadSingle = avatarUpload.single("avatar");
export const summaryDocumentUploadSingle = summaryDocumentUpload.single("file");

export function toPublicAvatarUrl(filename: string) {
  return `${PUBLIC_AVATAR_PATH_PREFIX}${filename}`;
}

export function resolveAvatarAbsolutePath(avatarUrl: string) {
  if (!avatarUrl.startsWith(PUBLIC_AVATAR_PATH_PREFIX)) {
    return null;
  }

  const filename = avatarUrl.slice(PUBLIC_AVATAR_PATH_PREFIX.length);
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return null;
  }

  return path.join(AVATAR_UPLOAD_DIR, filename);
}
