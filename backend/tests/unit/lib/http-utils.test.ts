import { parseIntParam, requireEnum, requireInt, requireString } from "../../../src/utils/http.js";

describe("http utils", () => {
  it("parses numeric route params", () => {
    expect(parseIntParam("12", "id")).toBe(12);
    expect(parseIntParam(["9"], "id")).toBe(9);
  });

  it("throws for invalid numeric route params", () => {
    expect(() => parseIntParam("0", "id")).toThrow("Invalid id");
    expect(() => parseIntParam("abc", "id")).toThrow("Invalid id");
  });

  it("validates required strings", () => {
    expect(requireString(" hello ", "name")).toBe("hello");
    expect(() => requireString("", "name")).toThrow("name cannot be empty");
    expect(() => requireString(123, "name")).toThrow("name must be a string");
  });

  it("validates required ints", () => {
    expect(requireInt(7, "count")).toBe(7);
    expect(() => requireInt(-1, "count")).toThrow("count must be a positive integer");
  });

  it("validates enum values", () => {
    const value = requireEnum("QUIZ", ["SUMMARY", "QUIZ", "DECK"], "type");
    expect(value).toBe("QUIZ");
    expect(() => requireEnum("OTHER", ["SUMMARY", "QUIZ", "DECK"], "type")).toThrow(
      "type must be one of: SUMMARY, QUIZ, DECK",
    );
  });
});
