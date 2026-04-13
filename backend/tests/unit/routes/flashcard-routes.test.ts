import request from "supertest";
import { createFlashcardRouter } from "../../../src/routes/flashcard-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("flashcard-routes", () => {
  it("creates a flashcard", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/flashcards", createFlashcardRouter(ctx));

    mocks.flashcard.create.mockResolvedValue({ id: 1, deckId: 3 } as never);

    const response = await request(app)
      .post("/flashcards")
      .send({ deckId: 3, front: "Q", back: "A" });

    expect(response.status).toBe(201);
    expect(mocks.flashcard.create).toHaveBeenCalledWith({
      data: { deckId: 3, front: "Q", back: "A" },
      include: { deck: true },
    });
  });
  it("lists flashcards and handles get-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/flashcards", createFlashcardRouter(ctx));

    mocks.flashcard.findMany.mockResolvedValue([] as never);
    mocks.flashcard.findUnique.mockResolvedValue(null as never);
    mocks.flashcard.update.mockResolvedValue({ id: 1 } as never);
    mocks.flashcard.delete.mockResolvedValue({ id: 1 } as never);

    expect((await request(app).get("/flashcards")).status).toBe(200);
    expect((await request(app).get("/flashcards/1")).status).toBe(404);
    expect((await request(app).patch("/flashcards/1").send({ front: "Updated" })).status).toBe(200);
    expect((await request(app).delete("/flashcards/1")).status).toBe(200);
  });
});