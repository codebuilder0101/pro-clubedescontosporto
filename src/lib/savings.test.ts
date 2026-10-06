import { describe, expect, it } from "vitest";
import { yearlyPlanMonthsSaved } from "./pricing";
import { estimateSavings, OUTINGS_RANGE, SPEND_RANGE } from "./savings";

describe("estimateSavings", () => {
  it("matches the prototype defaults (4 outings × 25 € at restaurants)", () => {
    expect(estimateSavings(4, 25, "restaurants")).toEqual({ monthly: 22, yearly: 264, multiple: 22 });
  });

  it("uses the category rate", () => {
    expect(estimateSavings(4, 25, "bars").monthly).toBe(30);
    expect(estimateSavings(4, 25, "culture").monthly).toBe(18);
  });

  it("never reports less than 1× the pass cost", () => {
    expect(estimateSavings(OUTINGS_RANGE.min, SPEND_RANGE.min, "culture")).toEqual({
      monthly: 1,
      yearly: 12,
      multiple: 1,
    });
  });

  it("handles the top of both ranges", () => {
    expect(estimateSavings(OUTINGS_RANGE.max, SPEND_RANGE.max, "bars")).toEqual({
      monthly: 720,
      yearly: 8640,
      multiple: 720,
    });
  });
});

describe("yearlyPlanMonthsSaved", () => {
  it("is 2 months at 1 €/month vs 10 €/year", () => {
    expect(yearlyPlanMonthsSaved()).toBe(2);
  });

  it("is never negative", () => {
    expect(yearlyPlanMonthsSaved(1, 15)).toBe(0);
  });
});
