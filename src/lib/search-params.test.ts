import { describe, expect, it } from "vitest";
import { escapeLike, parseSearchQuery, searchTerms } from "./search-params";

describe("parseSearchQuery", () => {
  it("normalises valid input", () => {
    expect(parseSearchQuery({ q: "  francesinha   ribeira ", category: "restaurants", zone: "foz", page: "2" })).toEqual({
      q: "francesinha ribeira",
      category: "restaurants",
      zone: "foz",
      page: 2,
    });
  });

  it("drops invalid values instead of failing", () => {
    expect(parseSearchQuery({ q: ["a", "b"], category: "DROP TABLE", zone: "", page: "-4" })).toEqual({
      q: "a",
      category: undefined,
      zone: undefined,
      page: 1,
    });
  });

  it("caps the query length", () => {
    expect(parseSearchQuery({ q: "x".repeat(500) }).q).toHaveLength(80);
  });
});

describe("searchTerms", () => {
  it("splits into lower-case words of 2+ characters, max 6", () => {
    expect(searchTerms("Café, do Porto! a")).toEqual(["café", "do", "porto"]);
    expect(searchTerms("a b c d e f g h i j k l m n o p q r s t u v w x y z aa bb cc dd ee ff gg")).toHaveLength(6);
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});
