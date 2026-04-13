import request from "supertest";
import { ProjectType } from "../../../generated/prisma/index.js";
import { createQuizRouter } from "../../../src/routes/quiz-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("quiz-routes", () => {
  it("lists quizzes and handles get/create-not-found/update/delete", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quizzes", createQuizRouter(ctx));

    mocks.quiz.findMany.mockResolvedValue([] as never);
    mocks.quiz.findUnique.mockResolvedValue(null as never);
    mocks.project.findUnique.mockResolvedValue(null as never);
    mocks.quiz.update.mockResolvedValue({ id: 3 } as never);
    mocks.quiz.delete.mockResolvedValue({ id: 3 } as never);

    expect((await request(app).get("/quizzes")).status).toBe(200);
    expect((await request(app).get("/quizzes/3")).status).toBe(404);
    expect((await request(app).post("/quizzes").send({ projectId: 3 })).status).toBe(404);
    expect((await request(app).patch("/quizzes/3").send({ projectId: 4 })).status).toBe(200);
    expect((await request(app).delete("/quizzes/3")).status).toBe(200);
  });

  it("rejects create when project type is not QUIZ", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quizzes", createQuizRouter(ctx));

    mocks.project.findUnique.mockResolvedValue({ type: ProjectType.SUMMARY } as never);

    const response = await request(app).post("/quizzes").send({ projectId: 10 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Project type must be QUIZ");
    expect(mocks.quiz.create).not.toHaveBeenCalled();
  });
});