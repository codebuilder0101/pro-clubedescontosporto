import { describe, expect, it } from "vitest";
import { slugify, SLUG_PATTERN } from "./slug";

describe("slugify", () => {
  it("folds accents and punctuation", () => {
    expect(slugify("Café Bolhão Novo")).toBe("cafe-bolhao-novo");
    expect(slugify("  Petiscos & Granito!! ")).toBe("petiscos-e-granito");
    expect(slugify("Rabelo ao Pôr do Sol")).toBe("rabelo-ao-por-do-sol");
  });
  it("produces valid slugs", () => {
    for (const s of ["Tasca da Viela", "Ç'est la vie — 2x1", "ÁÉÍÓÚ"]) expect(slugify(s)).toMatch(SLUG_PATTERN);
  });
});
