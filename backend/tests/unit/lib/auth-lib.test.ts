import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import { getCurrentAuthUser, loginUser, registerUser } from "../../../src/lib/auth-lib.js";
import { hashPassword } from "../../../src/utils/password.js";

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;
const ORIGINAL_JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

function createCtx() {
  const user = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  const ctx = {
    prisma: {
      user,
    },
  } as unknown as AppContext;

  return { ctx, user };
}

describe("auth-lib", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "auth-lib-test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (ORIGINAL_JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
    }

    if (ORIGINAL_JWT_EXPIRES_IN === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = ORIGINAL_JWT_EXPIRES_IN;
    }
  });

  it("registers a new user with normalized email", async () => {
    const { ctx, user } = createCtx();

    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("0000000000000000000000000000000000000000:2", { status: 200 }));

    user.findUnique.mockResolvedValueOnce(null as never).mockResolvedValueOnce(null as never);
    user.create.mockResolvedValue({
      id: 17,
      email: "new@example.com",
      username: "new_user",
      name: "New User",
      timetable: null,
    } as never);

    const result = await registerUser(
      {
        email: "NEW@EXAMPLE.COM",
        username: "new_user",
        password: "StrongPass1",
        name: "New User",
      },
      ctx,
    );

    expect(user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { email: "new@example.com" },
      select: { id: true },
    });
    expect(user.findUnique).toHaveBeenNthCalledWith(2, {
      where: { username: "new_user" },
      select: { id: true },
    });
    expect(user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@example.com",
          username: "new_user",
          name: "New User",
          timetable: undefined,
        }),
      }),
    );
    expect(typeof result.token).toBe("string");
    expect(result.user).toEqual({
      id: 17,
      email: "new@example.com",
      username: "new_user",
      name: "New User",
      timetable: null,
    });
  });

  it("rejects registration when email already exists", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValueOnce({ id: 1 } as never);

    await expect(
      registerUser(
        {
          email: "used@example.com",
          username: "new_user",
          password: "StrongPass1",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Email is already in use",
    });

    expect(user.findUnique).toHaveBeenCalledTimes(1);
    expect(user.create).not.toHaveBeenCalled();
  });

  it("rejects registration when username already exists", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValueOnce(null as never).mockResolvedValueOnce({ id: 2 } as never);

    await expect(
      registerUser(
        {
          email: "new@example.com",
          username: "used_user",
          password: "StrongPass1",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Username is already in use",
    });

    expect(user.create).not.toHaveBeenCalled();
  });

  it("rejects registration when password validation fails", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValueOnce(null as never).mockResolvedValueOnce(null as never);

    await expect(
      registerUser(
        {
          email: "new@example.com",
          username: "new_user",
          password: "abc",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Password does not meet security requirements",
      details: {
        errors: expect.arrayContaining(["Password must contain at least one number"]),
      },
    });

    expect(user.create).not.toHaveBeenCalled();
  });

  it("logs in successfully and strips hashed password from response", async () => {
    const { ctx, user } = createCtx();
    const hashedPassword = await hashPassword("StrongPass1");

    user.findUnique.mockResolvedValue({
      id: 42,
      email: "demo@example.com",
      username: "demo_user",
      name: "Demo",
      timetable: null,
      hashedPassword,
    } as never);

    const result = await loginUser(
      {
        email: "DEMO@EXAMPLE.COM",
        password: "StrongPass1",
      },
      ctx,
    );

    expect(user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "demo@example.com" },
      }),
    );
    expect(result.user).toEqual({
      id: 42,
      email: "demo@example.com",
      username: "demo_user",
      name: "Demo",
      timetable: null,
    });
    expect(typeof result.token).toBe("string");
  });

  it("rejects login when user does not exist", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValue(null as never);

    await expect(
      loginUser(
        {
          email: "missing@example.com",
          password: "StrongPass1",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });

  it("rejects login when password does not match", async () => {
    const { ctx, user } = createCtx();
    const hashedPassword = await hashPassword("StrongPass1");

    user.findUnique.mockResolvedValue({
      id: 42,
      email: "demo@example.com",
      username: "demo_user",
      name: "Demo",
      timetable: null,
      hashedPassword,
    } as never);

    await expect(
      loginUser(
        {
          email: "demo@example.com",
          password: "WrongPass1",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });

  it("returns current auth user", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValue({
      id: 7,
      email: "auth@example.com",
      username: "auth_user",
      name: "Auth",
      timetable: null,
    } as never);

    const result = await getCurrentAuthUser(7, ctx);

    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        timetable: true,
      },
    });
    expect(result).toEqual({
      id: 7,
      email: "auth@example.com",
      username: "auth_user",
      name: "Auth",
      timetable: null,
    });
  });

  it("rejects when current auth user is missing", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValue(null as never);

    await expect(getCurrentAuthUser(999, ctx)).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });
});