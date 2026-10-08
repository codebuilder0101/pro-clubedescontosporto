import { describe, expect, it } from "vitest";
import { pickTranslation } from "./content-locale";

const rows = [
  { locale: "en", title: "EN" },
  { locale: "pt-PT", title: "PT" },
];

describe("pickTranslation", () => {
  it("prefers the requested locale", () => {
    expect(pickTranslation(rows, "en")?.title).toBe("EN");
  });
  it("falls back to pt-PT, then to the first row", () => {
    expect(pickTranslation(rows, "es")?.title).toBe("PT");
    expect(pickTranslation([{ locale: "en", title: "EN" }], "pt-BR")?.title).toBe("EN");
    expect(pickTranslation([], "en")).toBeUndefined();
  });
});
