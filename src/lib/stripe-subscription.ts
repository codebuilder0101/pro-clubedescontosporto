import type Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@/generated/prisma/enums";

const STATUS: Record<string, SubscriptionStatus> = {
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  paused: "PAUSED",
};

export type SubscriptionFields = {
  status: SubscriptionStatus;
  plan: Plan;
  stripePriceId: string | null;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

/**
 * Our columns from a Stripe Subscription object. Since API 2025-03 the period
 * lives on the subscription item. Unknown statuses map to UNPAID (no access).
 */
export function subscriptionFields(sub: Stripe.Subscription): SubscriptionFields {
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end ?? sub.ended_at ?? sub.created;
  return {
    status: STATUS[sub.status] ?? "UNPAID",
    plan: item?.price.recurring?.interval === "year" ? "YEARLY" : "MONTHLY",
    stripePriceId: item?.price.id ?? null,
    currentPeriodEnd: new Date(periodEnd * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

export function customerId(customer: string | { id: string } | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}
