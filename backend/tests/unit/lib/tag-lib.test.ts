import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { createTag, deleteTag, getTagById, listTags, updateTag } from "../../../src/lib/tag-lib.js";

const tagInclude = {
  projects: {
    include: {
      project: true,
    },
  },
};

function createCtx() {
  const tag = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const ctx = { prisma: { tag } } as unknown as AppContext;
  return { ctx, tag };
}

describe("tag-lib", () => {
  it("lists tags", () => {
    const { ctx, tag } = createCtx();
    listTags(ctx);

    expect(tag.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      include: tagInclude,
    });
  });

  it("gets tag by id", () => {
    const { ctx, tag } = createCtx();
    getTagById(6, ctx);

    expect(tag.findUnique).toHaveBeenCalledWith({
      where: { id: 6 },
      include: tagInclude,
    });
  });

  it("creates tag", () => {
    const { ctx, tag } = createCtx();
    const data = { name: "math" };
    createTag(data as never, ctx);

    expect(tag.create).toHaveBeenCalledWith({
      data,
      include: tagInclude,
    });
  });

  it("updates tag", () => {
    const { ctx, tag } = createCtx();
    const data = { name: "science" };
    updateTag(6, data as never, ctx);

    expect(tag.update).toHaveBeenCalledWith({
      where: { id: 6 },
      data,
      include: tagInclude,
    });
  });

  it("deletes tag", () => {
    const { ctx, tag } = createCtx();
    deleteTag(6, ctx);

    expect(tag.delete).toHaveBeenCalledWith({
      where: { id: 6 },
      include: tagInclude,
    });
  });
});