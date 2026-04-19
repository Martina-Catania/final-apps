import type { AppContext } from "../context.js";
import { ApiError } from "../utils/api-error.js";
import { generateAuthToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { validatePasswordWithBreachCheck } from "../utils/password-validation.js";

const authUserSelect = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  timetable: true,
} as const;

type AuthUser = {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  timetable: string | null;
};

type AuthPayload = {
  user: AuthUser;
  token: string;
};

type RegisterInput = {
  email: string;
  username: string;
  password: string;
  timetable?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateProfileInput = {
  username?: string;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(input: RegisterInput, ctx: AppContext): Promise<AuthPayload> {
  const email = input.email.trim().toLowerCase();
  const username = input.username;

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const existingByEmail = await ctx.prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingByEmail) {
    throw new ApiError(409, "Email is already in use");
  }

  const existingByUsername = await ctx.prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existingByUsername) {
    throw new ApiError(409, "Username is already in use");
  }

  const passwordValidation = await validatePasswordWithBreachCheck(input.password);
  if (!passwordValidation.isValid) {
    throw new ApiError(400, "Password does not meet security requirements", {
      errors: passwordValidation.errors,
    });
  }

  const hashedPassword = await hashPassword(input.password);
  const user = await ctx.prisma.user.create({
    data: {
      email,
      username,
      hashedPassword,
      timetable: input.timetable,
    },
    select: authUserSelect,
  });

  return {
    user,
    token: generateAuthToken(user.id),
  };
}

export async function loginUser(input: LoginInput, ctx: AppContext): Promise<AuthPayload> {
  const email = input.email.toLowerCase();

  const user = await ctx.prisma.user.findUnique({
    where: { email },
    select: {
      ...authUserSelect,
      hashedPassword: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await verifyPassword(input.password, user.hashedPassword);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { hashedPassword: _hashedPassword, ...authUser } = user;

  return {
    user: authUser,
    token: generateAuthToken(authUser.id),
  };
}

export async function getCurrentAuthUser(userId: number, ctx: AppContext): Promise<AuthUser> {
  const user = await ctx.prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  return user;
}

export async function updateCurrentAuthUserProfile(
  userId: number,
  input: UpdateProfileInput,
  ctx: AppContext,
): Promise<AuthUser> {
  const data: {
    username?: string;
  } = {};

  if (input.username !== undefined) {
    const existingByUsername = await ctx.prisma.user.findUnique({
      where: { username: input.username },
      select: { id: true },
    });

    if (existingByUsername && existingByUsername.id !== userId) {
      throw new ApiError(409, "Username is already in use");
    }

    data.username = input.username;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "At least one profile field is required");
  }

  return ctx.prisma.user.update({
    where: { id: userId },
    data,
    select: authUserSelect,
  });
}

export async function changeCurrentAuthUserPassword(
  userId: number,
  input: ChangePasswordInput,
  ctx: AppContext,
): Promise<void> {
  const user = await ctx.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      hashedPassword: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const isCurrentPasswordValid = await verifyPassword(
    input.currentPassword,
    user.hashedPassword,
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const passwordValidation = await validatePasswordWithBreachCheck(input.newPassword);
  if (!passwordValidation.isValid) {
    throw new ApiError(400, "Password does not meet security requirements", {
      errors: passwordValidation.errors,
    });
  }

  const hashedPassword = await hashPassword(input.newPassword);
  await ctx.prisma.user.update({
    where: { id: userId },
    data: { hashedPassword },
  });
}

export async function updateCurrentAuthUserAvatar(
  userId: number,
  avatarUrl: string,
  ctx: AppContext,
): Promise<AuthUser> {
  return ctx.prisma.user.update({
    where: { id: userId },
    data: {
      avatarUrl,
    },
    select: authUserSelect,
  });
}