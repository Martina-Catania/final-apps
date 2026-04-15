import request from "supertest";
import { createSummaryFileRouter } from "../../../src/routes/summary-file-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("summary-file-routes", () => {
  it("lists summary files and handles get-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    mocks.summaryFile.findMany.mockResolvedValue([] as never);
    mocks.summaryFile.findUnique.mockResolvedValue(null as never);
    mocks.summaryFile.update.mockResolvedValue({ id: 4 } as never);
    mocks.summaryFile.delete.mockResolvedValue({ id: 4 } as never);

    expect((await request(app).get("/summary-files")).status).toBe(200);
    expect((await request(app).get("/summary-files/4")).status).toBe(404);
    expect((await request(app).patch("/summary-files/4").send({ filename: "updated.pdf" })).status).toBe(200);
    expect((await request(app).delete("/summary-files/4")).status).toBe(200);
  });

  it("creates a summary file", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    mocks.summaryFile.create.mockResolvedValue({ id: 2, summaryId: 1, filename: "notes.pdf" } as never);

    const response = await request(app)
      .post("/summary-files")
      .send({ summaryId: 1, filename: "notes.pdf" });

    expect(response.status).toBe(201);
    expect(mocks.summaryFile.create).toHaveBeenCalledWith({
      data: { summaryId: 1, filename: "notes.pdf" },
      include: { summary: true },
    });
  });

  it("returns summary file by id when found", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    mocks.summaryFile.findUnique.mockResolvedValue({ id: 4, summaryId: 1, filename: "notes.pdf" } as never);

    const response = await request(app).get("/summary-files/4");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 4, summaryId: 1, filename: "notes.pdf" });
  });

  it("patches summary file with numeric summaryId", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    mocks.summaryFile.update.mockResolvedValue({ id: 4, summaryId: 2 } as never);

    const response = await request(app).patch("/summary-files/4").send({ summaryId: 2 });

    expect(response.status).toBe(200);
    expect(mocks.summaryFile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ summaryId: 2 }),
      }),
    );
  });
});