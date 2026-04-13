import request from "supertest";
import { createFollowRouter } from "../../../src/routes/follow-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("follow-routes", () => {
  it("lists follows and handles get-not-found/create/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/follows", createFollowRouter(ctx));

    mocks.follow.findMany.mockResolvedValue([] as never);
    mocks.follow.findUnique.mockResolvedValue(null as never);
    mocks.follow.create.mockResolvedValue({ followerId: 1, followingId: 2 } as never);
    mocks.follow.delete.mockResolvedValue({ followerId: 1, followingId: 2 } as never);

    expect((await request(app).get("/follows")).status).toBe(200);
    expect((await request(app).get("/follows/1/2")).status).toBe(404);
    expect((await request(app).post("/follows").send({ followerId: 1, followingId: 2 })).status).toBe(201);
    expect((await request(app).delete("/follows/1/2")).status).toBe(200);
  });

  it("rejects self-follow", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/follows", createFollowRouter(ctx));

    const response = await request(app)
      .post("/follows")
      .send({ followerId: 4, followingId: 4 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Users cannot follow themselves");
    expect(mocks.follow.create).not.toHaveBeenCalled();
  });
});