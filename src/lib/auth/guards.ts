import "server-only";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { redirect } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/safe-redirect";
import { isSubscriptionActive, ACCESS_STATUSES, STRIPE_GRACE_MS } from "@/lib/membership";
import { getCurrentSession, type SessionUser } from "./session";

// Access control lives here. Every Server Component, Route Handler and
// Server Action that returns member content calls requireActiveMember()
// first (CLAUDE.md rule 1). Redirects are thrown, so nothing after the call
// runs for a visitor without access.

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  return (await getCurrentSession())?.user ?? null;
});

/** The subscription that currently grants access, or null. */
export const getActiveSubscription = cache(async (userId: string) => {
  const now = new Date();
  const candidates = await db.subscription.findMany({
    where: {
      userId,
      status: { in: [...ACCESS_STATUSES] },
      currentPeriodEnd: { gt: new Date(now.getTime() - STRIPE_GRACE_MS) },
    },
    orderBy: { currentPeriodEnd: "desc" },
  });
  return candidates.find((s) => isSubscriptionActive(s, now)) ?? null;
});

/**
 * The admin sees the member area (to preview offers) without paying: a
 * synthetic pass that is never stored.
 */
function adminPass(userId: string) {
  const now = new Date();
  return {
    id: "admin-pass",
    userId,
    provider: "MANUAL" as const,
    stripeSubscriptionId: null,
    stripePriceId: null,
    plan: "YEARLY" as const,
    status: "ACTIVE" as const,
    currentPeriodEnd: new Date(now.getTime() + 365 * 86_400_000),
    cancelAtPeriodEnd: false,
    lastStripeEventAt: null,
    note: "admin",
    createdAt: now,
    updatedAt: now,
  };
}

function loginHref(next?: string) {
  return next ? { pathname: "/login", query: { next } } : "/login";
}

/** Signed-in user, or redirect to the login page (coming back to `next`). */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: loginHref(next), locale: await getLocale() });
    throw new Error("unreachable");
  }
  return user;
}

/**
 * Signed-in user with an active subscription. Visitors go to the login page,
 * signed-in users without access go to the plan step of the join flow.
 */
export async function requireActiveMember(next?: string) {
  const user = await requireUser(next);
  const subscription = (await getActiveSubscription(user.id)) ?? (user.role === "ADMIN" ? adminPass(user.id) : null);
  if (!subscription) {
    redirect({ href: "/join", locale: await getLocale() });
    throw new Error("unreachable");
  }
  return { user, subscription };
}

/** Auth pages (login, join form, reset): signed-in visitors skip the form. */
export async function redirectIfSignedIn(next?: string | null) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = await getLocale();
  if (user.role === "ADMIN") {
    redirect({ href: safeNextPath(next) ?? "/admin", locale });
    return;
  }
  const active = await getActiveSubscription(user.id);
  redirect({ href: active ? (safeNextPath(next) ?? "/home") : "/join", locale });
}

/**
 * The single admin role (decision 2026-10-09). Non-admins get a 404 so the
 * backoffice doesn't reveal that it exists; visitors go to the login page.
 */
export async function requireAdmin(next = "/admin") {
  const user = await requireUser(next);
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** Latest subscription of any status, for the account page (failed payments etc.). */
export const getLatestSubscription = cache(async (userId: string) => {
  return db.subscription.findFirst({ where: { userId }, orderBy: [{ updatedAt: "desc" }] });
});
