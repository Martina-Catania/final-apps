import request from "supertest";
import { createQuizQuestionRouter } from "../../../src/routes/quiz-question-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("quiz-question-routes", () => {
  it("lists quiz questions and handles get-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quiz-questions", createQuizQuestionRouter(ctx));

    mocks.quizQuestion.findMany.mockResolvedValue([] as never);
    mocks.quizQuestion.findUnique.mockResolvedValue(null as never);
    mocks.quizQuestion.update.mockResolvedValue({ id: 7 } as never);
    mocks.quizQuestion.delete.mockResolvedValue({ id: 7 } as never);

    expect((await request(app).get("/quiz-questions")).status).toBe(200);
    expect((await request(app).get("/quiz-questions/7")).status).toBe(404);
    expect((await request(app).patch("/quiz-questions/7").send({ question: "Q" })).status).toBe(200);
    expect((await request(app).delete("/quiz-questions/7")).status).toBe(200);
  });

  it("creates a quiz question", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quiz-questions", createQuizQuestionRouter(ctx));

    mocks.quizQuestion.create.mockResolvedValue({ id: 9, quizId: 2 } as never);

    const response = await request(app)
      .post("/quiz-questions")
      .send({
        quizId: 2,
        question: "What is 2+2?",
        answer: "4",
        decoy1: "3",
        decoy2: "5",
        decoy3: "22",
      });

    expect(response.status).toBe(201);
    expect(mocks.quizQuestion.create).toHaveBeenCalledWith({
      data: {
        quizId: 2,
        question: "What is 2+2?",
        answer: "4",
        decoy1: "3",
        decoy2: "5",
        decoy3: "22",
      },
      include: { quiz: true },
    });
  });
});