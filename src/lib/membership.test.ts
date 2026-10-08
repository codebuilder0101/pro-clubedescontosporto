import { describe, expect, it } from "vitest";
import { formatMemberNumber, isSubscriptionActive, STRIPE_GRACE_MS } from "./membership";

const now = new Date("2026-10-08T12:00:00Z");
const day = 86_400_000;

describe("isSubscriptionActive", () => {
  it("grants access while ACTIVE or TRIALING and inside the period", () => {
    for (const status of ["ACTIVE", "TRIALING"] as const) {
      expect(isSubscriptionActive({ provider: "STRIPE", status, currentPeriodEnd: new Date(+now + day) }, now)).toBe(true);
    }
  });

  it.each(["PAST_DUE", "CANCELED", "UNPAID", "INCOMPLETE", "INCOMPLETE_EXPIRED", "PAUSED"] as const)(
    "denies %s even inside the period",
    (status) => {
      expect(isSubscriptionActive({ provider: "STRIPE", status, currentPeriodEnd: new Date(+now + 30 * day) }, now)).toBe(false);
    },
  );

  it("keeps Stripe members in for a short grace period after the period ends", () => {
    const justEnded = new Date(+now - day);
    expect(isSubscriptionActive({ provider: "STRIPE", status: "ACTIVE", currentPeriodEnd: justEnded }, now)).toBe(true);
    const longAgo = new Date(+now - STRIPE_GRACE_MS - 1000);
    expect(isSubscriptionActive({ provider: "STRIPE", status: "ACTIVE", currentPeriodEnd: longAgo }, now)).toBe(false);
  });

  it("gives manual grants no grace", () => {
    expect(isSubscriptionActive({ provider: "MANUAL", status: "ACTIVE", currentPeriodEnd: new Date(+now - 1000) }, now)).toBe(false);
  });
});

describe("formatMemberNumber", () => {
  it("groups the 8 digits in two blocks", () => {
    expect(formatMemberNumber("04821937")).toBe("0482 1937");
  });
});
