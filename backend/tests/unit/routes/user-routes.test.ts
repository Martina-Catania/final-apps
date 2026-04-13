import request from "supertest";
import { createUserRouter } from "../../../src/routes/user-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("user-routes", () => {
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
          .send({ email: "a@example.com", username: "alpha", hashedPassword: "hash", name: "Alpha" })
      ).status,
    ).toBe(201);
    expect((await request(app).patch("/users/11").send({ name: "Beta" })).status).toBe(200);
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
});