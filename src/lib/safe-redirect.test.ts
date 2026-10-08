import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps internal paths with their query", () => {
    expect(safeNextPath("/offers/tasca-da-viela")).toBe("/offers/tasca-da-viela");
    expect(safeNextPath("/explore?q=caf%C3%A9&zone=foz")).toBe("/explore?q=caf%C3%A9&zone=foz");
  });

  it.each([
    "https://evil.example/",
    "//evil.example/path",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "offers",
    "",
    "/\u0000x",
    "/\tfoo",
    `/${"a".repeat(600)}`,
  ])("rejects %j", (input) => {
    expect(safeNextPath(input)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(["/home"])).toBeNull();
  });

  it("drops fragments and normalises dot segments inside the site", () => {
    expect(safeNextPath("/a/../card#x")).toBe("/card");
  });
});
