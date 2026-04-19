import request from "supertest";
import { createTagRouter } from "../../../src/routes/tag-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("tag-routes", () => {
  it("lists tags and handles get-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/tags", createTagRouter(ctx));

    mocks.tag.findMany.mockResolvedValue([] as never);
    mocks.tag.findUnique.mockResolvedValue(null as never);
    mocks.tag.update.mockResolvedValue({ id: 2, name: "next" } as never);
    mocks.tag.delete.mockResolvedValue({ id: 2 } as never);

    expect((await request(app).get("/tags")).status).toBe(200);
    expect((await request(app).get("/tags/2")).status).toBe(404);
    expect((await request(app).patch("/tags/2").send({ name: "NeXt" })).status).toBe(200);
    expect((await request(app).delete("/tags/2")).status).toBe(200);

    expect(mocks.tag.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "next" }),
      }),
    );
  });

  it("creates a tag", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/tags", createTagRouter(ctx));

    mocks.tag.create.mockResolvedValue({ id: 4, name: "typescript" } as never);

    const response = await request(app).post("/tags").send({ name: "TypeScript" });

    expect(response.status).toBe(201);
    expect(mocks.tag.create).toHaveBeenCalledWith({
      data: { name: "typescript" },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
      },
    });
  });

  it("returns tag by id when found", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/tags", createTagRouter(ctx));

    mocks.tag.findUnique.mockResolvedValue({ id: 2, name: "next" } as never);

    const response = await request(app).get("/tags/2");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 2, name: "next" });
  });
});