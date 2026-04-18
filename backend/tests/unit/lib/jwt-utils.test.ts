import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { ApiError } from "../../../src/utils/api-error.js";
import { generateAuthToken, verifyAuthToken } from "../../../src/utils/jwt.js";

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;
const ORIGINAL_JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

function expectApiError(error: unknown, statusCode: number, message: string) {
  expect(error).toBeInstanceOf(ApiError);
  const apiError = error as ApiError;
  expect(apiError.statusCode).toBe(statusCode);
  expect(apiError.message).toBe(message);
}

describe("jwt utils", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-secret";
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

  it("generates and verifies auth tokens", () => {
    const token = generateAuthToken(23);
    const decoded = verifyAuthToken(token);

    expect(typeof token).toBe("string");
    expect(decoded).toEqual({ userId: 23 });
  });

  it("throws when JWT secret is missing", () => {
    delete process.env.JWT_SECRET;

    let thrownError: unknown;

    try {
      generateAuthToken(1);
    } catch (error) {
      thrownError = error;
    }

    expectApiError(thrownError, 500, "JWT secret is not configured");
  });

  it("throws invalid token when decoded payload is not an object", () => {
    jest.spyOn(jwt, "verify").mockReturnValue("bad-payload" as never);

    let thrownError: unknown;

    try {
      verifyAuthToken("token");
    } catch (error) {
      thrownError = error;
    }

    expectApiError(thrownError, 401, "Invalid token");
  });

  it("throws invalid token when decoded sub cannot be parsed to positive integer", () => {
    jest.spyOn(jwt, "verify").mockReturnValue({ sub: "0" } as never);

    let thrownError: unknown;

    try {
      verifyAuthToken("token");
    } catch (error) {
      thrownError = error;
    }

    expectApiError(thrownError, 401, "Invalid token");
  });

  it("wraps non-ApiError verification failures", () => {
    jest.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("jwt failure");
    });

    let thrownError: unknown;

    try {
      verifyAuthToken("token");
    } catch (error) {
      thrownError = error;
    }

    expectApiError(thrownError, 401, "Invalid or expired token");
  });
});