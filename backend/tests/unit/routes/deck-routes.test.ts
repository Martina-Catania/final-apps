import request from "supertest";
import { ProjectType } from "../../../generated/prisma/index.js";
import { createDeckRouter } from "../../../src/routes/deck-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("deck-routes", () => {
  const deckInclude = {
    project: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    },
    flashcards: true,
  };

  it("lists decks and handles get/create-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/decks", createDeckRouter(ctx));

    mocks.deck.findMany.mockResolvedValue([] as never);
    mocks.deck.findUnique.mockResolvedValue(null as never);
    mocks.project.findUnique.mockResolvedValue(null as never);
    mocks.deck.update.mockResolvedValue({ id: 1, projectId: 2 } as never);
    mocks.deck.delete.mockResolvedValue({ id: 1 } as never);

    expect((await request(app).get("/decks")).status).toBe(200);
    expect((await request(app).get("/decks/1")).status).toBe(404);
    expect((await request(app).post("/decks").send({ projectId: 2 })).status).toBe(404);
    expect((await request(app).patch("/decks/1").send({ projectId: 2 })).status).toBe(200);
    expect((await request(app).delete("/decks/1")).status).toBe(200);
  });

  it("creates a deck when project type is DECK", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/decks", createDeckRouter(ctx));

    mocks.project.findUnique.mockResolvedValue({ type: ProjectType.DECK } as never);
    mocks.deck.create.mockResolvedValue({ id: 1, projectId: 7 } as never);

    const response = await request(app).post("/decks").send({ projectId: 7 });

    expect(response.status).toBe(201);
    expect(mocks.deck.create).toHaveBeenCalledWith({
      data: { projectId: 7 },
      include: deckInclude,
    });
  });

  it("returns deck by id when found", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/decks", createDeckRouter(ctx));

    mocks.deck.findUnique.mockResolvedValue({ id: 1, projectId: 7 } as never);

    const response = await request(app).get("/decks/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, projectId: 7 });
  });

  it("rejects create when project type is not DECK", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/decks", createDeckRouter(ctx));

    mocks.project.findUnique.mockResolvedValue({ type: ProjectType.QUIZ } as never);

    const response = await request(app).post("/decks").send({ projectId: 7 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Project type must be DECK");
    expect(mocks.deck.create).not.toHaveBeenCalled();
  });
});