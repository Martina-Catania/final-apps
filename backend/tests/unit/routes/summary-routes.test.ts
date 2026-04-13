import request from "supertest";
import { ProjectType } from "../../../generated/prisma/index.js";
import { createSummaryRouter } from "../../../src/routes/summary-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("summary-routes", () => {
  it("lists summaries and handles get/create-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summaries", createSummaryRouter(ctx));

    mocks.summary.findMany.mockResolvedValue([] as never);
    mocks.summary.findUnique.mockResolvedValue(null as never);
    mocks.summary.update.mockResolvedValue({ id: 6 } as never);
    mocks.summary.delete.mockResolvedValue({ id: 6 } as never);

    expect((await request(app).get("/summaries")).status).toBe(200);
    expect((await request(app).get("/summaries/6")).status).toBe(404);

    mocks.project.findUnique.mockResolvedValue({ type: ProjectType.SUMMARY } as never);
    mocks.summary.create.mockResolvedValue({ id: 8, projectId: 1, subject: "S", content: "C" } as never);

    expect(
      (
        await request(app)
          .post("/summaries")
          .send({ projectId: 1, subject: "S", content: "C" })
      ).status,
    ).toBe(201);

    mocks.project.findUnique.mockResolvedValue(null as never);

    expect(
      (
        await request(app)
          .post("/summaries")
          .send({ projectId: 1, subject: "S", content: "C" })
      ).status,
    ).toBe(404);

    expect((await request(app).patch("/summaries/6").send({ subject: "Updated" })).status).toBe(200);
    expect((await request(app).delete("/summaries/6")).status).toBe(200);
  });

  it("rejects create when project type is not SUMMARY", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summaries", createSummaryRouter(ctx));

    mocks.project.findUnique.mockResolvedValue({ type: ProjectType.DECK } as never);

    const response = await request(app)
      .post("/summaries")
      .send({ projectId: 9, subject: "Topic", content: "Body" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Project type must be SUMMARY");
    expect(mocks.summary.create).not.toHaveBeenCalled();
  });
});