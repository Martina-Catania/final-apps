import request from "supertest";
import { jest } from "@jest/globals";
import { createApp } from "../../src/app.js";
import { generateAuthToken } from "../../src/utils/jwt.js";
import { hashPassword } from "../../src/utils/password.js";
import { asAppContext, createMockContext, type MockContext } from "../context.js";

describe("api routes", () => {
  let mockCtx: MockContext;

  beforeEach(() => {
    mockCtx = createMockContext();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serves health endpoint", async () => {
    const app = createApp(asAppContext(mockCtx));
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("returns CORS headers for localhost frontend origins", async () => {
    const app = createApp(asAppContext(mockCtx));

    const response = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:8081");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:8081",
    );
    expect(response.headers["access-control-allow-methods"]).toBe(
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
  });

  it("returns CORS headers for private LAN frontend origins", async () => {
    const app = createApp(asAppContext(mockCtx));

    const response = await request(app)
      .get("/health")
      .set("Origin", "http://192.168.1.100:8081");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://192.168.1.100:8081",
    );
  });

  it("handles CORS preflight requests", async () => {
    const app = createApp(asAppContext(mockCtx));

    const response = await request(app)
      .options("/api/auth/register")
      .set("Origin", "http://localhost:8081")
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:8081",
    );
    expect(response.headers["access-control-allow-headers"]).toBe(
      "Content-Type,Authorization",
    );
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
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const response = await request(app).post("/api/users").send({
      email: "gamma@example.com",
      username: "gamma_user",
      hashedPassword: "gamma_hash",
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
      content: "Topic",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Project type must be SUMMARY");
    expect(mockCtx.mocks.summary.create).not.toHaveBeenCalled();
  });

  it("allows summary creation with empty content", async () => {
    const app = createApp(asAppContext(mockCtx));
    mockCtx.mocks.project.findUnique.mockResolvedValue({ type: "SUMMARY" } as never);
    mockCtx.mocks.summary.create.mockResolvedValue({
      id: 21,
      projectId: 10,
      content: "",
    } as never);

    const response = await request(app).post("/api/summaries").send({
      projectId: 10,
      content: "   ",
    });

    expect(response.status).toBe(201);
    expect(mockCtx.mocks.summary.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          projectId: 10,
          content: "",
        },
      }),
    );
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

  it("registers a user and returns auth payload", async () => {
    const app = createApp(asAppContext(mockCtx));

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("0000000000000000000000000000000000000000:2", {
        status: 200,
      }),
    );

    mockCtx.mocks.user.findUnique
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(null as never);
    mockCtx.mocks.user.create.mockResolvedValue({
      id: 11,
      email: "new@example.com",
      username: "new_user",
    } as never);

    const response = await request(app).post("/api/auth/register").send({
      email: "NEW@EXAMPLE.COM",
      username: "new_user",
      password: "StrongPass1",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.id).toBe(11);
    expect(response.body.user.email).toBe("new@example.com");
    expect(typeof response.body.token).toBe("string");
    expect(mockCtx.mocks.user.create).toHaveBeenCalledTimes(1);
  });

  it("rejects registration when password is weak", async () => {
    const app = createApp(asAppContext(mockCtx));

    const response = await request(app).post("/api/auth/register").send({
      email: "new@example.com",
      username: "new_user",
      password: "abc",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Password does not meet security requirements");
    expect(mockCtx.mocks.user.create).not.toHaveBeenCalled();
  });

  it("logs in a user and returns auth payload", async () => {
    const app = createApp(asAppContext(mockCtx));
    const hashedPassword = await hashPassword("StrongPass1");

    mockCtx.mocks.user.findUnique.mockResolvedValue({
      id: 5,
      email: "demo@example.com",
      username: "demo",
      hashedPassword,
    } as never);

    const response = await request(app).post("/api/auth/login").send({
      email: "demo@example.com",
      password: "StrongPass1",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(5);
    expect(typeof response.body.token).toBe("string");
  });

  it("rejects login when credentials are invalid", async () => {
    const app = createApp(asAppContext(mockCtx));
    mockCtx.mocks.user.findUnique.mockResolvedValue(null as never);

    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "StrongPass1",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password");
  });

  it("returns current user when bearer token is valid", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(7);

    mockCtx.mocks.user.findUnique.mockResolvedValue({
      id: 7,
      email: "auth@example.com",
      username: "auth_user",
    } as never);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(7);
    expect(response.body.user.email).toBe("auth@example.com");
  });

  it("rejects current-user request without token", async () => {
    const app = createApp(asAppContext(mockCtx));
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization token is required");
  });

  it("updates current user profile", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(7);

    mockCtx.mocks.user.findUnique.mockResolvedValue(null as never);
    mockCtx.mocks.user.update.mockResolvedValue({
      id: 7,
      email: "auth@example.com",
      username: "updated_user",
      avatarUrl: null,
    } as never);

    const response = await request(app)
      .patch("/api/auth/me/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: "updated_user",
      });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe("updated_user");
  });

  it("changes current user password", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(7);
    const hashedPassword = await hashPassword("StrongPass1");

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("0000000000000000000000000000000000000000:2", {
        status: 200,
      }),
    );

    mockCtx.mocks.user.findUnique.mockResolvedValue({
      id: 7,
      hashedPassword,
    } as never);
    mockCtx.mocks.user.update.mockResolvedValue({ id: 7 } as never);

    const response = await request(app)
      .patch("/api/auth/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "StrongPass1",
        newPassword: "StrongerPass2",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("rejects search requests without an authorization token", async () => {
    const app = createApp(asAppContext(mockCtx));

    const response = await request(app)
      .get("/api/search")
      .query({ q: "ali" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization token is required");
  });

  it("validates search query params", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(9);

    const response = await request(app)
      .get("/api/search")
      .set("Authorization", `Bearer ${token}`)
      .query({ q: "   " });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("q, tagIds or projectTypes is required");
  });

  it("validates project type filters in search query params", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(9);

    const response = await request(app)
      .get("/api/search")
      .set("Authorization", `Bearer ${token}`)
      .query({ projectTypes: "ARTICLE" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("projectTypes must be one of: SUMMARY, QUIZ, DECK");
  });

  it("returns project results for tags-only search", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(9);

    mockCtx.mocks.project.count.mockResolvedValue(1 as never);
    mockCtx.mocks.project.findMany.mockResolvedValue([
      {
        id: 22,
        type: "QUIZ",
        title: "Algorithms Basics",
        timesPlayed: 47,
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        user: {
          id: 5,
          username: "creator",
          avatarUrl: null,
        },
        quiz: {
          id: 30,
        },
        deck: null,
        tags: [
          {
            tag: {
              id: 6,
              name: "math",
            },
          },
        ],
      },
    ] as never);

    const response = await request(app)
      .get("/api/search")
      .set("Authorization", `Bearer ${token}`)
      .query({ tagIds: "6" });

    expect(response.status).toBe(200);
    expect(response.body.query).toBe("");
    expect(response.body.users).toEqual([]);
    expect(response.body.projects).toHaveLength(1);
    expect(response.body.projects[0].tags).toEqual([{ id: 6, name: "math" }]);
    expect(mockCtx.mocks.user.findMany).not.toHaveBeenCalled();

    expect(mockCtx.mocks.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tags: {
            some: {
              tagId: {
                in: [6],
              },
            },
          },
        },
      }),
    );
  });

  it("returns project results for project-type-only search", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(9);

    mockCtx.mocks.project.count.mockResolvedValue(1 as never);
    mockCtx.mocks.project.findMany.mockResolvedValue([
      {
        id: 31,
        type: "DECK",
        title: "Biology Cards",
        timesPlayed: 12,
        createdAt: new Date("2026-04-12T10:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        user: {
          id: 5,
          username: "creator",
          avatarUrl: null,
        },
        quiz: null,
        summary: null,
        deck: {
          id: 44,
        },
        tags: [],
      },
    ] as never);

    const response = await request(app)
      .get("/api/search")
      .set("Authorization", `Bearer ${token}`)
      .query({ projectTypes: "DECK" });

    expect(response.status).toBe(200);
    expect(response.body.query).toBe("");
    expect(response.body.users).toEqual([]);
    expect(response.body.projects).toHaveLength(1);
    expect(response.body.projects[0]).toMatchObject({
      id: 31,
      type: "DECK",
      deckId: 44,
    });
    expect(mockCtx.mocks.user.findMany).not.toHaveBeenCalled();

    expect(mockCtx.mocks.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: {
            in: ["DECK"],
          },
        },
      }),
    );
  });

  it("returns ranked users and paginated projects for search results", async () => {
    const app = createApp(asAppContext(mockCtx));
    const token = generateAuthToken(9);

    mockCtx.mocks.user.findMany.mockResolvedValue([
      {
        id: 1,
        username: "Malik",
        avatarUrl: null,
        _count: {
          followers: 1,
          following: 2,
          projects: 3,
        },
      },
      {
        id: 2,
        username: "Alina",
        avatarUrl: null,
        _count: {
          followers: 4,
          following: 5,
          projects: 6,
        },
      },
      {
        id: 3,
        username: "alice",
        avatarUrl: null,
        _count: {
          followers: 7,
          following: 8,
          projects: 9,
        },
      },
    ] as never);

    mockCtx.mocks.project.count.mockResolvedValue(2 as never);
    mockCtx.mocks.project.findMany.mockResolvedValue([
      {
        id: 22,
        type: "QUIZ",
        title: "Algorithms Basics",
        timesPlayed: 47,
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        user: {
          id: 5,
          username: "creator",
          avatarUrl: null,
        },
        quiz: {
          id: 30,
        },
        deck: null,
        tags: [],
      },
    ] as never);

    const response = await request(app)
      .get("/api/search")
      .set("Authorization", `Bearer ${token}`)
      .query({
        q: "ali",
        tagIds: "3",
        usersPage: "2",
        usersLimit: "1",
        projectsPage: "2",
        projectsLimit: "1",
      });

    expect(response.status).toBe(200);
    expect(response.body.query).toBe("ali");

    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0]).toMatchObject({
      id: 2,
      username: "Alina",
      followerCount: 4,
      followingCount: 5,
      projectCount: 6,
    });

    expect(response.body.usersPagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });

    expect(response.body.projects).toHaveLength(1);
    expect(response.body.projects[0]).toMatchObject({
      id: 22,
      title: "Algorithms Basics",
      timesPlayed: 47,
      quizId: 30,
      deckId: null,
    });

    expect(response.body.projectsPagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });

    expect(mockCtx.mocks.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          title: {
            contains: "ali",
          },
          tags: {
            some: {
              tagId: {
                in: [3],
              },
            },
          },
        },
        orderBy: [
          {
            timesPlayed: "desc",
          },
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        skip: 1,
        take: 1,
      }),
    );
  });
});
