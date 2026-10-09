import { describe, expect, it } from "vitest";
import { dateToLisbonInput, lisbonInputToDate } from "./timezone";

describe("Lisbon local time <-> UTC", () => {
  it("handles winter (UTC+0) and summer (UTC+1)", () => {
    expect(lisbonInputToDate("2026-12-24T19:30")?.toISOString()).toBe("2026-12-24T19:30:00.000Z");
    expect(lisbonInputToDate("2026-07-01T19:30")?.toISOString()).toBe("2026-07-01T18:30:00.000Z");
  });
  it("round-trips", () => {
    for (const v of ["2026-03-29T12:00", "2026-10-25T09:15", "2027-01-01T00:00"]) {
      expect(dateToLisbonInput(lisbonInputToDate(v)!)).toBe(v);
    }
  });
  it("rejects malformed input", () => {
    expect(lisbonInputToDate("24/12/2026 19:30")).toBeNull();
    expect(lisbonInputToDate("")).toBeNull();
  });
});
