import { unlink } from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { createSummaryFileRouter } from "../../../src/routes/summary-file-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

async function cleanupUploadedFile(filename: string) {
  const absolutePath = path.resolve(process.cwd(), "uploads", "summary-files", filename);
  await unlink(absolutePath).catch(() => undefined);
}

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

  it("creates a summary file from json payload", async () => {
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

  it("creates a summary file from multipart upload", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    mocks.summaryFile.create.mockResolvedValue({ id: 2, summaryId: 1, filename: "stored.pdf" } as never);

    const response = await request(app)
      .post("/summary-files")
      .field("summaryId", "1")
      .attach("file", Buffer.from("%PDF-1.7 test"), {
        filename: "notes.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(mocks.summaryFile.create).toHaveBeenCalledTimes(1);

    const createArgs = mocks.summaryFile.create.mock.calls[0]?.[0] as {
      data: {
        summaryId: number;
        filename: string;
      };
    };

    expect(createArgs.data.summaryId).toBe(1);
    expect(createArgs.data.filename).toMatch(/\.pdf$/);

    await cleanupUploadedFile(createArgs.data.filename);
  });

  it("rejects multipart upload when file type is unsupported", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    const response = await request(app)
      .post("/summary-files")
      .field("summaryId", "1")
      .attach("file", Buffer.from("plain-text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Summary file must be a PDF, DOC, or DOCX document");
    expect(mocks.summaryFile.create).not.toHaveBeenCalled();
  });

  it("rejects multipart upload when file is missing", async () => {
    const { ctx } = createRouteMockContext();
    const app = createRouteApp("/summary-files", createSummaryFileRouter(ctx));

    const response = await request(app)
      .post("/summary-files")
      .field("summaryId", "1");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Summary document file is required");
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