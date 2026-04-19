import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import {
  createProject,
  deleteProject,
  getProjectById,
  incrementProjectTimesPlayed,
  listProjects,
  updateProject,
} from "../../../src/lib/project-lib.js";

const projectInclude = {
  summary: true,
  quiz: true,
  deck: true,
  tags: {
    include: {
      tag: true,
    },
  },
};

function createCtx() {
  const project = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { project } } as unknown as AppContext;
  return { ctx, project };
}

describe("project-lib", () => {
  it("lists projects", () => {
    const { ctx, project } = createCtx();
    listProjects(ctx);

    expect(project.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: projectInclude,
    });
  });

  it("gets project by id", () => {
    const { ctx, project } = createCtx();
    getProjectById(9, ctx);

    expect(project.findUnique).toHaveBeenCalledWith({
      where: { id: 9 },
      include: projectInclude,
    });
  });

  it("creates project", () => {
    const { ctx, project } = createCtx();
    const data = { userId: 1, type: "QUIZ", title: "Project" };
    createProject(data as never, ctx);

    expect(project.create).toHaveBeenCalledWith({
      data,
      include: projectInclude,
    });
  });

  it("updates project", () => {
    const { ctx, project } = createCtx();
    const data = { title: "Updated" };
    updateProject(9, data as never, ctx);

    expect(project.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data,
      include: projectInclude,
    });
  });

  it("deletes project", () => {
    const { ctx, project } = createCtx();
    deleteProject(9, ctx);

    expect(project.delete).toHaveBeenCalledWith({
      where: { id: 9 },
      include: projectInclude,
    });
  });

  it("increments project times played", () => {
    const { ctx, project } = createCtx();
    incrementProjectTimesPlayed(9, ctx);

    expect(project.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { timesPlayed: { increment: 1 } },
      include: projectInclude,
    });
  });
});