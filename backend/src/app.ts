import express from "express";
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

  app.use("/api", createApiRouter(ctx));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

