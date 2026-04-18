import * as Linking from "expo-linking";
import { Platform } from "react-native";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
const DEFAULT_NATIVE_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const DEFAULT_WEB_HOST = "localhost";
const DEFAULT_API_PORT = "3000";
const DEFAULT_API_TIMEOUT_MS = 12_000;

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function readApiPort(): string {
  const rawValue = process.env.EXPO_PUBLIC_API_PORT?.trim();

  if (!rawValue) {
    return DEFAULT_API_PORT;
  }

  const parsedPort = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    return DEFAULT_API_PORT;
  }

  return String(parsedPort);
}

function readApiTimeoutMs(): number {
  const rawValue = process.env.EXPO_PUBLIC_API_TIMEOUT_MS?.trim();

  if (!rawValue) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  const parsedTimeout = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedTimeout) || parsedTimeout < 1000) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  return parsedTimeout;
}

function extractHostFromUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname;

    if (!hostname) {
      return null;
    }

    if (LOCAL_HOSTNAMES.has(hostname.toLowerCase())) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

function getHostFromWebLocation(): string | null {
  if (Platform.OS !== "web") {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return extractHostFromUrl(window.location.href);
}

function getHostFromExpoDevUrl(): string | null {
  try {
    return extractHostFromUrl(Linking.createURL("/"));
  } catch {
    return null;
  }
}

function resolveDefaultApiHost(): string {
  if (Platform.OS === "web") {
    return getHostFromWebLocation() ?? DEFAULT_WEB_HOST;
  }

  return getHostFromExpoDevUrl() ?? DEFAULT_NATIVE_HOST;
}

export function getApiBaseUrl(): string {
  const explicitApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (explicitApiBaseUrl) {
    return stripTrailingSlashes(explicitApiBaseUrl);
  }

  const host = resolveDefaultApiHost();
  const port = readApiPort();

  return `http://${host}:${port}/api`;
}

export function getApiHostUrl(): string {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl.endsWith("/api")) {
    return apiBaseUrl.slice(0, -4);
  }

  return apiBaseUrl;
}

export class ApiRequestTimeoutError extends Error {
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "ApiRequestTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

type FetchWithTimeoutOptions = {
  timeoutMs?: number;
};

function resolveTimeoutMs(overrideTimeoutMs?: number): number {
  if (!Number.isInteger(overrideTimeoutMs) || (overrideTimeoutMs ?? 0) < 1000) {
    return readApiTimeoutMs();
  }

  return overrideTimeoutMs as number;
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  options?: FetchWithTimeoutOptions,
): Promise<Response> {
  const timeoutMs = resolveTimeoutMs(options?.timeoutMs);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiRequestTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function getApiConnectivityErrorMessage(apiBaseUrl: string, error: unknown): string {
  if (error instanceof ApiRequestTimeoutError) {
    return `Connection timed out after ${error.timeoutMs}ms. Ensure backend is running and reachable at ${apiBaseUrl}.`;
  }

  return `Unable to connect to backend at ${apiBaseUrl}. Ensure backend is running and reachable from this device.`;
}
