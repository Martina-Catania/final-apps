import request from "supertest";
import { ProjectType } from "../../../generated/prisma/index.js";
import { createProjectRouter } from "../../../src/routes/project-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("project-routes", () => {
  it("lists projects and handles get-not-found/create/tag-links/view-increment/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/projects", createProjectRouter(ctx));

    mocks.project.findMany.mockResolvedValue([] as never);
    mocks.project.findUnique.mockResolvedValue(null as never);
    mocks.project.create.mockResolvedValue({ id: 20 } as never);
    mocks.projectTag.create.mockResolvedValue({ projectId: 20, tagId: 1 } as never);
    mocks.projectTag.delete.mockResolvedValue({ projectId: 20, tagId: 1 } as never);
    mocks.project.update.mockResolvedValue({ id: 20, views: 2 } as never);
    mocks.project.delete.mockResolvedValue({ id: 20 } as never);

    expect((await request(app).get("/projects")).status).toBe(200);
    expect((await request(app).get("/projects/20")).status).toBe(404);
    expect((await request(app).post("/projects").send({ type: ProjectType.DECK, title: "P", userId: 1 })).status).toBe(201);
    expect((await request(app).post("/projects/20/tags/1")).status).toBe(201);
    expect((await request(app).delete("/projects/20/tags/1")).status).toBe(200);
    expect((await request(app).post("/projects/20/views/increment")).status).toBe(200);
    expect((await request(app).patch("/projects/20").send({ title: "Updated" })).status).toBe(200);
    expect((await request(app).delete("/projects/20")).status).toBe(200);
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
});