import type { SubscriptionProvider, SubscriptionStatus } from "@/generated/prisma/enums";

/** Stripe statuses that grant access. */
export const ACCESS_STATUSES: readonly SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/**
 * Renewal webhooks can arrive a little after the period ends; keep access for
 * this long past currentPeriodEnd so members aren't locked out at the counter.
 * If Stripe really ends the subscription, its webhook flips the status first.
 */
export const STRIPE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export type MembershipLike = {
  provider: SubscriptionProvider;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
};

export function isSubscriptionActive(sub: MembershipLike, now: Date = new Date()): boolean {
  if (!ACCESS_STATUSES.includes(sub.status)) return false;
  const grace = sub.provider === "STRIPE" ? STRIPE_GRACE_MS : 0;
  return sub.currentPeriodEnd.getTime() + grace > now.getTime();
}

/** Formats an 8-digit member number as printed on the card: "0482 1937". */
export function formatMemberNumber(memberNumber: string): string {
  return memberNumber.replace(/^(\d{4})(\d{4})$/, "$1 $2");
}
