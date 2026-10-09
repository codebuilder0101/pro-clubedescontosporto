import { describe, expect, it } from "vitest";
import { estimateSaving } from "./redemption";

describe("estimateSaving", () => {
  it("applies percentages to the bill", () => {
    expect(estimateSaving({ discountType: "PERCENT", discountValue: 30 }, 42.5)).toBe(12.75);
    expect(estimateSaving({ discountType: "PERCENT", discountValue: 30 }, null)).toBeNull();
  });
  it("uses the fixed amount, capped at the bill", () => {
    expect(estimateSaving({ discountType: "AMOUNT", discountValue: 10 }, null)).toBe(10);
    expect(estimateSaving({ discountType: "AMOUNT", discountValue: 10 }, 6)).toBe(6);
  });
  it("counts half the bill for 2-for-1 and nothing for OTHER", () => {
    expect(estimateSaving({ discountType: "TWO_FOR_ONE", discountValue: null }, 18)).toBe(9);
    expect(estimateSaving({ discountType: "OTHER", discountValue: null, badge: "x" }, 50)).toBeNull();
  });
});
