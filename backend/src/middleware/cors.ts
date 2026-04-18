import type { NextFunction, Request, Response } from "express";

const ALLOW_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ALLOW_HEADERS = "Content-Type,Authorization";

function parseConfiguredOrigins(rawOrigins: string | undefined): Set<string> {
  if (!rawOrigins) {
    return new Set();
  }

  return new Set(
    rawOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );
}

function isLocalDevOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isLoopbackHost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    return isHttp && isLoopbackHost;
  } catch {
    return false;
  }
}

function isOriginAllowed(origin: string): boolean {
  const configuredOrigins = parseConfiguredOrigins(process.env.CORS_ORIGIN);

  if (configuredOrigins.has("*")) {
    return true;
  }

  if (configuredOrigins.size > 0) {
    return configuredOrigins.has(origin);
  }

  return isLocalDevOrigin(origin);
}

function setCorsHeaders(response: Response, origin: string) {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.append("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS);
  response.setHeader("Access-Control-Allow-Headers", ALLOW_HEADERS);
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.header("origin");

  if (!origin) {
    next();
    return;
  }

  if (!isOriginAllowed(origin)) {
    if (req.method === "OPTIONS") {
      res.status(403).json({ error: "CORS origin is not allowed" });
      return;
    }

    next();
    return;
  }

  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}