import request from "supertest";
import { ProjectType } from "../../../generated/prisma/index.js";
import { createQuizRouter } from "../../../src/routes/quiz-routes.js";
import { createRouteApp, createRouteMockContext } from "./helpers.js";

describe("quiz-routes", () => {
  const quizInclude = {
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
    questions: true,
  };

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

  it("returns quiz by id when found", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quizzes", createQuizRouter(ctx));

    mocks.quiz.findUnique.mockResolvedValue({ id: 3, projectId: 7 } as never);

    const response = await request(app).get("/quizzes/3");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 3, projectId: 7 });
  });

  it("creates quiz when project type is QUIZ", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quizzes", createQuizRouter(ctx));

    mocks.project.findUnique.mockResolvedValue({ type: ProjectType.QUIZ } as never);
    mocks.quiz.create.mockResolvedValue({ id: 10, projectId: 9 } as never);

    const response = await request(app).post("/quizzes").send({ projectId: 9 });

    expect(response.status).toBe(201);
    expect(mocks.quiz.create).toHaveBeenCalledWith({
      data: { projectId: 9 },
      include: quizInclude,
    });
  });

  it("patches quiz without projectId", async () => {
    const { ctx, mocks } = createRouteMockContext();
    const app = createRouteApp("/quizzes", createQuizRouter(ctx));

    mocks.quiz.update.mockResolvedValue({ id: 3 } as never);

    const response = await request(app).patch("/quizzes/3").send({});

    expect(response.status).toBe(200);
    expect(mocks.quiz.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: undefined }),
      }),
    );
  });
});