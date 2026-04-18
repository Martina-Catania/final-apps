import express from "express";
import path from "node:path";
import { defaultAppContext, type AppContext } from "./context.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { createApiRouter } from "./routes/index.js";

export function createApp(ctx: AppContext = defaultAppContext) {
  const app = express();

  app.use(corsMiddleware);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.use("/api", createApiRouter(ctx));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

