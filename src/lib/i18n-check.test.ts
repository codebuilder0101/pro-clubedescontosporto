import { describe, expect, it } from "vitest";
import { checkMessages, placeholders } from "./i18n-check";

describe("placeholders", () => {
  it("extracts ICU argument names, ignoring plural branches", () => {
    expect(placeholders("{count, plural, one {# item} other {# items}} for {price}")).toEqual([
      "count",
      "price",
    ]);
  });

  it("does not mistake plural branch text for an argument", () => {
    expect(placeholders("{months, plural, one {Poupa # mês} other {Poupa # meses}}")).toEqual([
      "months",
    ]);
  });

  it("finds arguments nested in branches and tags", () => {
    expect(placeholders("{g, select, a {<b>{name}</b>} other {x}}")).toEqual(["g", "name"]);
  });
});

describe("checkMessages", () => {
  it("passes when all locales match", () => {
    expect(
      checkMessages({ a: { X: { y: "Olá {name}" } }, b: { X: { y: "Hi {name}" } } }, "a"),
    ).toEqual([]);
  });

  it("reports missing, empty and placeholder mismatches", () => {
    const issues = checkMessages(
      {
        a: { k1: "one", k2: "two {price}", k3: "three" },
        b: { k1: "", k2: "dos {amount}" },
      },
      "a",
    );
    expect(issues).toEqual([
      { locale: "b", key: "k1", problem: "empty" },
      { locale: "b", key: "k2", problem: "placeholders {amount} differ from a {price}" },
      { locale: "b", key: "k3", problem: "missing" },
    ]);
  });

  it("reports invalid ICU syntax", () => {
    expect(checkMessages({ a: { k: "ok" }, b: { k: "broken {" } }, "a")).toEqual([
      { locale: "b", key: "k", problem: "invalid ICU message syntax" },
    ]);
  });
});
