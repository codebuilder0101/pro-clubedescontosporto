/** Session lifetime. Renewed on use (see session.ts and the proxy). */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Read directly (not via seo.ts) so the proxy bundle stays small.
const secure = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https:");

/**
 * `__Host-` pins the cookie to this exact host over HTTPS (no Domain, Path=/).
 * Plain HTTP (local development, e2e) can't use the prefix.
 */
export const SESSION_COOKIE = secure ? "__Host-cdp_session" : "cdp_session";

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}
