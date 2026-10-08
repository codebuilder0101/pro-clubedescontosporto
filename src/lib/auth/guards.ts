import "server-only";
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
  const subscription = await getActiveSubscription(user.id);
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
  const active = await getActiveSubscription(user.id);
  redirect({ href: active ? (safeNextPath(next) ?? "/home") : "/join", locale: await getLocale() });
}
