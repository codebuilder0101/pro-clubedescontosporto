import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { customerId, subscriptionFields } from "./stripe-subscription";

function sub(overrides: Partial<Record<string, unknown>> = {}, interval: "month" | "year" = "month"): Stripe.Subscription {
  return {
    id: "sub_1",
    status: "active",
    created: 1_790_000_000,
    ended_at: null,
    cancel_at_period_end: false,
    items: { data: [{ current_period_end: 1_800_000_000, price: { id: "price_1", recurring: { interval } } }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("subscriptionFields", () => {
  it("maps status, plan, price and the item's period end", () => {
    expect(subscriptionFields(sub())).toEqual({
      status: "ACTIVE",
      plan: "MONTHLY",
      stripePriceId: "price_1",
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
      cancelAtPeriodEnd: false,
    });
    expect(subscriptionFields(sub({}, "year")).plan).toBe("YEARLY");
  });

  it("maps every Stripe status and treats unknown ones as no access", () => {
    expect(subscriptionFields(sub({ status: "past_due" })).status).toBe("PAST_DUE");
    expect(subscriptionFields(sub({ status: "incomplete_expired" })).status).toBe("INCOMPLETE_EXPIRED");
    expect(subscriptionFields(sub({ status: "something_new" })).status).toBe("UNPAID");
  });

  it("keeps cancel_at_period_end", () => {
    expect(subscriptionFields(sub({ cancel_at_period_end: true })).cancelAtPeriodEnd).toBe(true);
  });
});

describe("customerId", () => {
  it("accepts ids and expanded objects", () => {
    expect(customerId("cus_1")).toBe("cus_1");
    expect(customerId({ id: "cus_2" })).toBe("cus_2");
    expect(customerId(null)).toBeNull();
  });
});
