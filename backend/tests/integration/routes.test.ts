import request from "supertest";
import { createApp } from "../../src/app.js";
import { asAppContext, createMockContext, type MockContext } from "../context.js";

describe("api routes", () => {
  let mockCtx: MockContext;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  it("serves health endpoint", async () => {
    const app = createApp(asAppContext(mockCtx));
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("lists users via injected prisma context", async () => {
    const app = createApp(asAppContext(mockCtx));
    mockCtx.mocks.user.findMany.mockResolvedValue([
      {
        id: 1,
        email: "alpha@example.com",
      },
    ] as never);

    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(mockCtx.mocks.user.findMany).toHaveBeenCalledTimes(1);
  });

  it("creates a user via injected prisma context", async () => {
    const app = createApp(asAppContext(mockCtx));
    mockCtx.mocks.user.create.mockResolvedValue({
      id: 3,
      email: "gamma@example.com",
      username: "gamma_user",
      hashedPassword: "gamma_hash",
      name: "Gamma",
      timetable: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const response = await request(app).post("/api/users").send({
      email: "gamma@example.com",
      username: "gamma_user",
      hashedPassword: "gamma_hash",
      name: "Gamma",
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(3);
    expect(mockCtx.mocks.user.create).toHaveBeenCalledTimes(1);
  });

  it("rejects summary creation when project type is not SUMMARY", async () => {
    const app = createApp(asAppContext(mockCtx));
    mockCtx.mocks.project.findUnique.mockResolvedValue({ type: "QUIZ" } as never);

    const response = await request(app).post("/api/summaries").send({
      projectId: 10,
      subject: "History",
      content: "Topic",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Project type must be SUMMARY");
    expect(mockCtx.mocks.summary.create).not.toHaveBeenCalled();
  });

  it("creates project tag relation through injected context", async () => {
    const app = createApp(asAppContext(mockCtx));
    mockCtx.mocks.projectTag.create.mockResolvedValue({
      projectId: 8,
      tagId: 9,
    } as never);

    const response = await request(app)
      .post("/api/project-tags")
      .send({ projectId: 8, tagId: 9 });

    expect(response.status).toBe(201);
    expect(response.body.projectId).toBe(8);
    expect(response.body.tagId).toBe(9);
    expect(mockCtx.mocks.projectTag.create).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for unknown route without any DB setup", async () => {
    const app = createApp(asAppContext(mockCtx));
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Route not found");
  });
});
