import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from "./lib/auth/cookie";

const handleI18nRouting = createMiddleware(routing);

/**
 * Dynamic, never-cached pages where the session cookie may be refreshed.
 * Public pages are static and cacheable: a Set-Cookie with a session token
 * must never end up in a shared cache, so they don't get one.
 */
const SESSION_PAGES = /^\/(?:pt|br|es|en)\/(?:home|explore|offers|card|account|join)(?:\/|$)/;

export default function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Sliding session: keep the cookie alive while the member uses the site.
  // This only extends the cookie; whether the session is valid is decided on
  // the server against the database (session.ts), never here.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && SESSION_PAGES.test(request.nextUrl.pathname)) {
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(new Date(Date.now() + SESSION_TTL_MS)));
  }
  return response;
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
