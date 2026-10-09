import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from "./cookie";
import { generateToken, hashToken } from "./tokens";

// Database sessions: the cookie carries a random token, the Session row is
// keyed by its SHA-256. Revoking a session is a row delete.
//
// Why not Auth.js: its Credentials (email + password) provider only works
// with JWT sessions, and this project requires revocable database sessions.

/** Extend the session when less than this is left (sliding expiry). */
const RENEW_WHEN_LEFT_MS = 15 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, userAgent?: string | null) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { id: hashToken(token), userId, expiresAt, userAgent: userAgent?.slice(0, 300) || null },
  });
  return { token, expiresAt };
}

/** Server Actions / Route Handlers only (Server Components can't set cookies). */
export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function deleteSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { ...sessionCookieOptions(new Date(0)), maxAge: 0 });
}

export async function validateSessionToken(token: string) {
  const id = hashToken(token);
  const session = await db.session.findUnique({
    where: { id },
    select: {
      id: true,
      expiresAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          memberNumber: true,
          preferredLocale: true,
          stripeCustomerId: true,
          blockedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now || session.user.blockedAt) {
    await db.session.deleteMany({ where: { id } });
    return null;
  }
  const renew = session.expiresAt.getTime() - now < RENEW_WHEN_LEFT_MS;
  const touch = now - session.lastUsedAt.getTime() > 60 * 60 * 1000;
  if (renew || touch) {
    // The proxy refreshes the cookie's own expiry on every navigation.
    if (renew) session.expiresAt = new Date(now + SESSION_TTL_MS);
    await db.session.update({ where: { id }, data: { expiresAt: session.expiresAt, lastUsedAt: new Date(now) } });
  }
  return session;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof validateSessionToken>>>["user"];

/** The current request's session, read once per render. */
export const getCurrentSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSessionToken(token);
});

export async function invalidateSession(token: string) {
  await db.session.deleteMany({ where: { id: hashToken(token) } });
}

export async function invalidateUserSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/** SHA-256 id of the current session, to mark "this device" in the device list. */
export async function currentSessionId() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

/** Current cookie token, if any (for sign-out). */
export async function currentSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
