import request from "supertest";
import { ProjectType } from "../../../generated/prisma/index.js";
import { createProjectRouter } from "../../../src/routes/project-routes.js";
import { generateAuthToken } from "../../../src/utils/jwt.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("project-routes", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  it("lists projects and handles get-not-found/create/tag-links/times-played-increment/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));
    const ownerToken = generateAuthToken(1);

    mocks.project.findMany.mockResolvedValue([] as never);
    mocks.project.findUnique
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ id: 20, userId: 1 } as never);
    mocks.project.create.mockResolvedValue({ id: 20 } as never);
    mocks.projectTag.create.mockResolvedValue({ projectId: 20, tagId: 1 } as never);
    mocks.projectTag.delete.mockResolvedValue({ projectId: 20, tagId: 1 } as never);
    mocks.project.update.mockResolvedValue({ id: 20, timesPlayed: 2 } as never);
    mocks.project.delete.mockResolvedValue({ id: 20 } as never);

    expect((await request(app).get("/projects")).status).toBe(200);
    expect((await request(app).get("/projects/20")).status).toBe(404);
    expect((await request(app).post("/projects").send({ type: ProjectType.DECK, title: "P", userId: 1 })).status).toBe(201);
    expect((await request(app).post("/projects/20/tags/1")).status).toBe(201);
    expect((await request(app).delete("/projects/20/tags/1")).status).toBe(200);
    expect((await request(app).post("/projects/20/times-played/increment")).status).toBe(200);
    expect((await request(app).patch("/projects/20").send({ title: "Updated" })).status).toBe(200);
    expect(
      (
        await request(app)
          .delete("/projects/20")
          .set("Authorization", `Bearer ${ownerToken}`)
      ).status,
    ).toBe(200);
  });

  it("lists tags for a project", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));

    mocks.projectTag.findMany.mockResolvedValue([{ projectId: 5, tagId: 3 }] as never);

    const response = await request(app).get("/projects/5/tags");

    expect(response.status).toBe(200);
    expect(mocks.projectTag.findMany).toHaveBeenCalledWith({
      where: { projectId: 5 },
      include: { tag: true },
      orderBy: { tagId: "asc" },
    });
  });

  it("lists projects from followed users for authenticated requests", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));
    const token = generateAuthToken(7);

    mocks.project.findMany.mockResolvedValue([
      {
        id: 21,
        type: "QUIZ",
        title: "History Sprint",
      },
    ] as never);

    const response = await request(app)
      .get("/projects/following")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 21,
        type: "QUIZ",
        title: "History Sprint",
      },
    ]);
    expect(mocks.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: {
            followers: {
              some: {
                followerId: 7,
              },
            },
          },
        }),
      }),
    );
  });

  it("requires authentication to list projects from followed users", async () => {
    const { ctx } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));

    const response = await request(app).get("/projects/following");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization token is required");
  });

  it("returns a project by id when found", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));

    mocks.project.findUnique.mockResolvedValue({ id: 20, title: "P" } as never);

    const response = await request(app).get("/projects/20");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 20, title: "P" });
  });

  it("patches project with type and userId", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));

    mocks.project.update.mockResolvedValue({ id: 20, type: ProjectType.QUIZ, userId: 8 } as never);

    const response = await request(app)
      .patch("/projects/20")
      .send({ type: ProjectType.QUIZ, userId: 8 });

    expect(response.status).toBe(200);
    expect(mocks.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: ProjectType.QUIZ, userId: 8 }),
      }),
    );
  });

  it("requires authentication to delete a project", async () => {
    const { ctx } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));

    const response = await request(app).delete("/projects/20");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization token is required");
  });

  it("forbids deleting a project owned by another user", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));
    const requesterToken = generateAuthToken(2);

    mocks.project.findUnique.mockResolvedValue({ id: 20, userId: 1 } as never);

    const response = await request(app)
      .delete("/projects/20")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("You are not allowed to delete this project");
    expect(mocks.project.delete).not.toHaveBeenCalled();
  });
});