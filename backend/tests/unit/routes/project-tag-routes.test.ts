import request from "supertest";
import { createProjectTagRouter } from "../../../src/routes/project-tag-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("project-tag-routes", () => {
  it("lists project-tag relations and handles get-not-found/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/project-tags", createProjectTagRouter(ctx));

    mocks.projectTag.findMany.mockResolvedValue([] as never);
    mocks.projectTag.findUnique.mockResolvedValue(null as never);
    mocks.projectTag.delete.mockResolvedValue({ projectId: 1, tagId: 2 } as never);

    expect((await request(app).get("/project-tags")).status).toBe(200);
    expect((await request(app).get("/project-tags/1/2")).status).toBe(404);
    expect((await request(app).delete("/project-tags/1/2")).status).toBe(200);
  });

  it("creates a project-tag relation", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/project-tags", createProjectTagRouter(ctx));

    mocks.projectTag.create.mockResolvedValue({ projectId: 2, tagId: 3 } as never);

    const response = await request(app)
      .post("/project-tags")
      .send({ projectId: 2, tagId: 3 });

    expect(response.status).toBe(201);
    expect(mocks.projectTag.create).toHaveBeenCalledWith({
      data: { projectId: 2, tagId: 3 },
      include: { project: true, tag: true },
    });
  });
});