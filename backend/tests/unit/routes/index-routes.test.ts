import express from "express";
import request from "supertest";
import { createApiRouter } from "../../../src/routes/index.js";
import { errorHandler } from "../../../src/middleware/error-handler.js";
import { notFoundHandler } from "../../../src/middleware/not-found.js";
import { createRouteMockContext } from "./helpers.js";

describe("routes/index", () => {
  it("mounts users route under /api", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = express();
    app.use(express.json());
    app.use("/api", createApiRouter(ctx));
    app.use(notFoundHandler);
    app.use(errorHandler);

    mocks.user.findMany.mockResolvedValue([] as never);

    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(mocks.user.findMany).toHaveBeenCalledTimes(1);
  });
});