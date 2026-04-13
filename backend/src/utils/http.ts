import { ApiError } from "./api-error.js";

export function parseIntParam(raw: string | string[], name: string): number {
  const firstValue = Array.isArray(raw) ? raw[0] : raw;
  const value = Number.parseInt(firstValue, 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new ApiError(400, `Invalid ${name}`);
  }

  return value;
}

export function requireString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new ApiError(400, `${name} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new ApiError(400, `${name} cannot be empty`);
  }

  return trimmed;
}

export function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return requireString(value, name);
}

export function requireInt(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ApiError(400, `${name} must be a positive integer`);
  }

  return value;
}

export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  name: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(400, `${name} must be one of: ${allowed.join(", ")}`);
  }

  return value as T;
}

