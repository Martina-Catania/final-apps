import { createHash } from "node:crypto";
import { jest } from "@jest/globals";
import {
  checkPasswordBreach,
  validatePassword,
  validatePasswordWithBreachCheck,
} from "../../../src/utils/password-validation.js";

function sha1Hex(input: string) {
  return createHash("sha1").update(input).digest("hex").toUpperCase();
}

describe("password-validation utils", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("validates strong passwords successfully", () => {
    const result = validatePassword("StrongPass1");

    expect(result).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it("returns expected errors for weak passwords", () => {
    const result = validatePassword("12345");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must be at least 6 characters long");
    expect(result.errors).toContain("Password must contain at least one letter");
    expect(result.errors).toContain("Password must contain at least one uppercase letter");
  });

  it("detects compromised password via HIBP range response", async () => {
    const password = "StrongPass1";
    const hash = sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(`${suffix}:42\n0000000000000000000000000000000000000:2`, { status: 200 }),
    );

    const result = await checkPasswordBreach(password);

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        method: "GET",
        headers: {
          "Add-Padding": "true",
        },
      },
    );
    expect(result).toEqual({
      isBreached: true,
      error:
        "This password has been found in data breaches and is not secure. Please choose a different password.",
    });
  });

  it("returns fallback message when HIBP API response is not ok", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("service down", { status: 503 }));

    const result = await checkPasswordBreach("StrongPass1");

    expect(result.isBreached).toBe(false);
    expect(result.error).toBe(
      "Unable to verify password security at this time. Please ensure your password meets all requirements.",
    );
  });

  it("short-circuits breach checks when basic validation fails", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    const result = await validatePasswordWithBreachCheck("12345");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must be at least 6 characters long");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns invalid when password is breached", async () => {
    const password = "StrongPass1";
    const hash = sha1Hex(password);
    const suffix = hash.slice(5);

    jest.spyOn(global, "fetch").mockResolvedValue(new Response(`${suffix}:9`, { status: 200 }));

    const result = await validatePasswordWithBreachCheck(password);

    expect(result).toEqual({
      isValid: false,
      errors: [
        "This password has been found in data breaches and is not secure. Please choose a different password.",
      ],
      isBreached: true,
    });
  });

  it("returns valid when basic checks pass and password is not breached", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("0000000000000000000000000000000000000:4", { status: 200 }),
    );

    const result = await validatePasswordWithBreachCheck("StrongPass1");

    expect(result).toEqual({
      isValid: true,
      errors: [],
      isBreached: false,
    });
  });
});