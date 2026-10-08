import { describe, expect, it } from "vitest";
import { formatDiscount } from "./discount";

const labels = { twoForOne: "2x1" };
const nbsp = " ";

describe("formatDiscount", () => {
  it("formats percentages per locale (es keeps a no-break space)", () => {
    const d = { discountType: "PERCENT" as const, discountValue: 30 };
    expect(formatDiscount("pt-PT", d, labels)).toBe("-30%");
    expect(formatDiscount("en", d, labels)).toBe("-30%");
    expect(formatDiscount("es", d, labels)).toBe(`-30${nbsp}%`);
    // French keeps a no-break space before % as well.
    expect(formatDiscount("fr", d, labels)).toBe(`-30${nbsp}%`);
  });

  it("formats euro amounts per locale", () => {
    const d = { discountType: "AMOUNT" as const, discountValue: 10 };
    expect(formatDiscount("en", d, labels)).toBe("-€10");
    expect(formatDiscount("pt-PT", d, labels)).toBe(`-10${nbsp}€`);
  });

  it("uses the translated label for 2-for-1 and the badge for OTHER", () => {
    expect(formatDiscount("en", { discountType: "TWO_FOR_ONE", discountValue: null }, { twoForOne: "2-for-1" })).toBe("2-for-1");
    expect(formatDiscount("en", { discountType: "OTHER", discountValue: null, badge: "Free dessert" }, labels)).toBe("Free dessert");
  });
});
