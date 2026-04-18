import type { AppContext } from "../context.js";
import { ApiError } from "../utils/api-error.js";
import { generateAuthToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { validatePasswordWithBreachCheck } from "../utils/password-validation.js";

const authUserSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  timetable: true,
} as const;

type AuthUser = {
  id: number;
  email: string;
  username: string;
  name: string;
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
  name?: string;
  timetable?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export async function registerUser(input: RegisterInput, ctx: AppContext): Promise<AuthPayload> {
  const email = input.email.toLowerCase();
  const username = input.username;

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
      name: input.name ?? "",
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