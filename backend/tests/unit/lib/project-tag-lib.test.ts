import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createProjectTag, deleteProjectTag, getProjectTag, listProjectTags } from "../../../src/lib/project-tag-lib.js";

function createCtx() {
  const projectTag = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { projectTag } } as unknown as AppContext;
  return { ctx, projectTag };
}

describe("project-tag-lib", () => {
  it("lists project tag relations", () => {
    const { ctx, projectTag } = createCtx();
    listProjectTags(ctx);

    expect(projectTag.findMany).toHaveBeenCalledWith({
      orderBy: [{ projectId: "asc" }, { tagId: "asc" }],
      include: { project: true, tag: true },
    });
  });

  it("gets project tag by composite key", () => {
    const { ctx, projectTag } = createCtx();
    getProjectTag(2, 3, ctx);

    expect(projectTag.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_tagId: {
          projectId: 2,
          tagId: 3,
        },
      },
      include: { project: true, tag: true },
    });
  });

  it("creates project tag", () => {
    const { ctx, projectTag } = createCtx();
    const data = { projectId: 2, tagId: 3 };
    createProjectTag(data as never, ctx);

    expect(projectTag.create).toHaveBeenCalledWith({
      data,
      include: { project: true, tag: true },
    });
  });

  it("deletes project tag by composite key", () => {
    const { ctx, projectTag } = createCtx();
    deleteProjectTag(2, 3, ctx);

    expect(projectTag.delete).toHaveBeenCalledWith({
      where: {
        projectId_tagId: {
          projectId: 2,
          tagId: 3,
        },
      },
      include: { project: true, tag: true },
    });
  });
});