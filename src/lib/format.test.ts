import { describe, expect, it } from "vitest";
import { formatDateTime, formatMoney } from "./format";

// Intl uses narrow/regular no-break spaces; normalise them for readable asserts.
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("formatMoney", () => {
  it("formats whole euros without decimals per locale", () => {
    expect(plain(formatMoney("pt-PT", 1))).toBe("1 €");
    expect(plain(formatMoney("fr", 1))).toBe("1 €");
    expect(plain(formatMoney("es", 10))).toBe("10 €");
    expect(formatMoney("en", 1)).toBe("€1");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(plain(formatMoney("pt-PT", 10.5))).toBe("10,50 €");
    expect(formatMoney("en", 10.5)).toBe("€10.50");
  });
});

describe("formatDateTime", () => {
  it("uses the Europe/Lisbon time zone", () => {
    // 23:30 UTC on 31 Dec is already 1 Jan in Madrid but still 31 Dec in Lisbon (UTC+0 in winter).
    const d = new Date("2026-12-31T23:30:00Z");
    expect(formatDateTime("en", d, { day: "numeric", month: "short" })).toBe("31 Dec");
    // Summer time: 23:30 UTC on 30 June is 00:30 on 1 July in Lisbon (UTC+1).
    const s = new Date("2026-06-30T23:30:00Z");
    expect(formatDateTime("en", s, { day: "numeric", month: "short" })).toBe("1 Jul");
  });
});
