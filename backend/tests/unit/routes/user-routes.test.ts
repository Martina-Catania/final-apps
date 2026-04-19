import request from "supertest";
import { createUserRouter } from "../../../src/routes/user-routes.js";
import { generateAuthToken } from "../../../src/utils/jwt.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("user-routes", () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeEach(() => {
    process.env.JWT_SECRET = "user-routes-test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalJwtExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
    }
  });

  it("lists users and handles get-not-found/following/create/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/users", createUserRouter(ctx));

    mocks.user.findMany.mockResolvedValue([] as never);
    mocks.user.findUnique.mockResolvedValue(null as never);
    mocks.follow.findMany.mockResolvedValue([] as never);
    mocks.user.create.mockResolvedValue({ id: 11 } as never);
    mocks.user.update.mockResolvedValue({ id: 11 } as never);
    mocks.user.delete.mockResolvedValue({ id: 11 } as never);

    expect((await request(app).get("/users")).status).toBe(200);
    expect((await request(app).get("/users/11")).status).toBe(404);
    expect((await request(app).get("/users/11/following")).status).toBe(200);
    expect(
      (
        await request(app)
          .post("/users")
          .send({ email: "a@example.com", username: "alpha", hashedPassword: "hash" })
      ).status,
    ).toBe(201);
    expect((await request(app).patch("/users/11").send({ username: "beta" })).status).toBe(200);
    expect((await request(app).delete("/users/11")).status).toBe(200);
  });

  it("returns followers for a user", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/users", createUserRouter(ctx));

    mocks.follow.findMany.mockResolvedValue([{ followerId: 2, followingId: 1 }] as never);

    const response = await request(app).get("/users/1/followers");

    expect(response.status).toBe(200);
    expect(mocks.follow.findMany).toHaveBeenCalledWith({
      where: { followingId: 1 },
      include: { follower: true },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns user by id when found", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/users", createUserRouter(ctx));

    mocks.user.findUnique.mockResolvedValue({ id: 11, username: "alpha" } as never);

    const response = await request(app).get("/users/11");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 11, username: "alpha" });
  });

  it("returns profile summary for authenticated viewer", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/users", createUserRouter(ctx));
    const token = generateAuthToken(5);

    mocks.user.findUnique.mockResolvedValue({
      id: 11,
      username: "alpha",
      avatarUrl: null,
    } as never);
    mocks.follow.count.mockResolvedValueOnce(3 as never).mockResolvedValueOnce(4 as never);
    mocks.project.count.mockResolvedValue(2 as never);
    mocks.project.findMany.mockResolvedValue([
      {
        id: 18,
        type: "QUIZ",
        title: "Project",
        views: 12,
        createdAt: new Date("2026-04-18T10:00:00.000Z"),
        updatedAt: new Date("2026-04-18T10:00:00.000Z"),
        quiz: { id: 4 },
        deck: null,
      },
    ] as never);
    mocks.follow.findUnique.mockResolvedValue({ followerId: 5 } as never);

    const response = await request(app)
      .get("/users/11/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(11);
    expect(response.body.stats.followerCount).toBe(3);
    expect(response.body.stats.followingCount).toBe(4);
    expect(response.body.stats.projectCount).toBe(2);
    expect(response.body.isFollowing).toBe(true);
    expect(response.body.projects[0]).toEqual(
      expect.objectContaining({
        id: 18,
        type: "QUIZ",
        quizId: 4,
        deckId: null,
      }),
    );
  });

  it("creates and deletes authenticated follow relation", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/users", createUserRouter(ctx));
    const token = generateAuthToken(7);

    mocks.user.findUnique.mockResolvedValue({ id: 10 } as never);
    mocks.follow.findUnique
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ followerId: 7, followingId: 10 } as never);
    mocks.follow.create.mockResolvedValue({ followerId: 7, followingId: 10 } as never);
    mocks.follow.delete.mockResolvedValue({ followerId: 7, followingId: 10 } as never);

    const createResponse = await request(app)
      .post("/users/10/follow")
      .set("Authorization", `Bearer ${token}`);
    expect(createResponse.status).toBe(201);

    const deleteResponse = await request(app)
      .delete("/users/10/follow")
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
  });

  it("rejects follow actions without token", async () => {
    const { ctx } = createRouteMockContext();
    const app = createRouteApp("/users", createUserRouter(ctx));

    const response = await request(app).post("/users/10/follow");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization token is required");
  });
});