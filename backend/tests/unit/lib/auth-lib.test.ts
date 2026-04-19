import { jest } from "@jest/globals";
import type { AppContext } from "../../../src/context.js";
import {
  changeCurrentAuthUserPassword,
  getCurrentAuthUser,
  loginUser,
  registerUser,
  updateCurrentAuthUserAvatar,
  updateCurrentAuthUserProfile,
} from "../../../src/lib/auth-lib.js";
import { hashPassword } from "../../../src/utils/password.js";

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;
const ORIGINAL_JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

function createCtx() {
  const user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
      avatarUrl: null,
      timetable: null,
    } as never);

    const result = await registerUser(
      {
        email: "NEW@EXAMPLE.COM",
        username: "new_user",
        password: "StrongPass1",
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
          timetable: undefined,
        }),
      }),
    );
    expect(typeof result.token).toBe("string");
    expect(result.user).toEqual({
      id: 17,
      email: "new@example.com",
      username: "new_user",
      avatarUrl: null,
      timetable: null,
    });
  });

  it("rejects registration when email format is invalid", async () => {
    const { ctx, user } = createCtx();

    await expect(
      registerUser(
        {
          email: "invalid-email",
          username: "new_user",
          password: "StrongPass1",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Please provide a valid email address",
    });

    expect(user.findUnique).not.toHaveBeenCalled();
    expect(user.create).not.toHaveBeenCalled();
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
      avatarUrl: null,
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
      avatarUrl: null,
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
      avatarUrl: null,
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
      avatarUrl: null,
      timetable: null,
    } as never);

    const result = await getCurrentAuthUser(7, ctx);

    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        timetable: true,
      },
    });
    expect(result).toEqual({
      id: 7,
      email: "auth@example.com",
      username: "auth_user",
      avatarUrl: null,
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

  it("updates current user profile", async () => {
    const { ctx, user } = createCtx();

    user.findUnique.mockResolvedValueOnce(null as never);
    user.update.mockResolvedValue({
      id: 7,
      email: "auth@example.com",
      username: "renamed_user",
      avatarUrl: null,
      timetable: null,
    } as never);

    const result = await updateCurrentAuthUserProfile(
      7,
      {
        username: "renamed_user",
      },
      ctx,
    );

    expect(user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { username: "renamed_user" },
      select: { id: true },
    });
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        username: "renamed_user",
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        timetable: true,
      },
    });
    expect(result).toEqual({
      id: 7,
      email: "auth@example.com",
      username: "renamed_user",
      avatarUrl: null,
      timetable: null,
    });
  });

  it("rejects profile update when username is already used by another user", async () => {
    const { ctx, user } = createCtx();
    user.findUnique.mockResolvedValue({ id: 9 } as never);

    await expect(
      updateCurrentAuthUserProfile(
        7,
        {
          username: "taken",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Username is already in use",
    });

    expect(user.update).not.toHaveBeenCalled();
  });

  it("changes password when current password is valid", async () => {
    const { ctx, user } = createCtx();
    const hashedPassword = await hashPassword("StrongPass1");

    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("0000000000000000000000000000000000000000:2", { status: 200 }));

    user.findUnique.mockResolvedValue({
      id: 7,
      hashedPassword,
    } as never);

    await changeCurrentAuthUserPassword(
      7,
      {
        currentPassword: "StrongPass1",
        newPassword: "StrongerPass2",
      },
      ctx,
    );

    expect(user.update).toHaveBeenCalledTimes(1);
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          hashedPassword: expect.any(String),
        }),
      }),
    );
  });

  it("rejects password change when current password is wrong", async () => {
    const { ctx, user } = createCtx();
    const hashedPassword = await hashPassword("StrongPass1");

    user.findUnique.mockResolvedValue({
      id: 7,
      hashedPassword,
    } as never);

    await expect(
      changeCurrentAuthUserPassword(
        7,
        {
          currentPassword: "WrongPass1",
          newPassword: "StrongerPass2",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Current password is incorrect",
    });

    expect(user.update).not.toHaveBeenCalled();
  });

  it("updates current user avatar", async () => {
    const { ctx, user } = createCtx();
    user.update.mockResolvedValue({
      id: 7,
      email: "auth@example.com",
      username: "auth_user",
      avatarUrl: "/uploads/avatars/avatar-1.jpg",
      timetable: null,
    } as never);

    const result = await updateCurrentAuthUserAvatar(
      7,
      "/uploads/avatars/avatar-1.jpg",
      ctx,
    );

    expect(user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        avatarUrl: "/uploads/avatars/avatar-1.jpg",
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        timetable: true,
      },
    });
    expect(result.avatarUrl).toBe("/uploads/avatars/avatar-1.jpg");
  });
});