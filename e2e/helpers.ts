import { createHash, randomBytes } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { hash } from "@node-rs/argon2";
import pg from "pg";

// Test fixtures that talk to the e2e database directly. Signing in by
// inserting a session (instead of the login form) keeps tests fast and away
// from the login rate limit; the login form has its own tests.

export const DEMO_PASSWORD = "Porto-2026!";
export const SESSION_COOKIE = "cdp_session";

let pool: pg.Pool | undefined;
export function db() {
  // UTC like the app (timestamps are stored without time zone).
  pool ??= new pg.Pool({ connectionString: process.env.E2E_DATABASE_URL, max: 4, options: "-c TimeZone=UTC" });
  return pool;
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${randomBytes(5).toString("hex")}@example.com`;
}

type Membership = "active" | "expired" | "none";

/** Creates a user (and optionally a manual subscription). Returns its id. */
export async function createUser(
  email: string,
  { name = "Teste E2E", membership = "none" as Membership, password = DEMO_PASSWORD, role = "MEMBER" as "MEMBER" | "ADMIN" } = {},
) {
  const id = `e2e${randomBytes(8).toString("hex")}`;
  await db().query(
    `INSERT INTO "User" (id, email, name, "passwordHash", "memberNumber", "termsAcceptedAt", "updatedAt", role)
     VALUES ($1, $2, $3, $4, $5, now(), now(), $6)`,
    [id, email, name, await hash(password), String(Math.floor(Math.random() * 1e8)).padStart(8, "0"), role],
  );
  if (membership !== "none") {
    const end = membership === "active" ? "now() + interval '30 days'" : "now() - interval '2 days'";
    await db().query(
      `INSERT INTO "Subscription" (id, "userId", provider, plan, status, "currentPeriodEnd", "updatedAt")
       VALUES ($1, $2, 'MANUAL', 'MONTHLY', $3, ${end}, now())`,
      [`sub${id}`, id, membership === "active" ? "ACTIVE" : "CANCELED"],
    );
  }
  return id;
}

/** Inserts a session for the user and returns the cookie token. */
export async function createSession(email: string) {
  const token = randomBytes(32).toString("base64url");
  const { rows } = await db().query(`SELECT id FROM "User" WHERE email = $1`, [email]);
  if (!rows[0]) throw new Error(`No user ${email}`);
  await db().query(`INSERT INTO "Session" (id, "userId", "expiresAt") VALUES ($1, $2, now() + interval '1 day')`, [
    createHash("sha256").update(token).digest("hex"),
    rows[0].id,
  ]);
  return token;
}

export async function signInAs(context: BrowserContext, email: string, baseURL: string) {
  const token = await createSession(email);
  await context.addCookies([{ name: SESSION_COOKIE, value: token, url: baseURL }]);
  return token;
}

export function cookieHeader(token: string) {
  return { cookie: `${SESSION_COOKIE}=${token}` };
}

/** A small JPEG for upload tests. */
export async function testPhoto(): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({ create: { width: 900, height: 600, channels: 3, background: { r: 30, g: 90, b: 180 } } }).jpeg().toBuffer();
}

/**
 * Waits until React has hydrated `selector` (its event handlers are live).
 * Pages with a map never reach "networkidle" (tiles keep loading).
 */
export async function waitForHydration(page: import("@playwright/test").Page, selector: string) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    },
    selector,
    { timeout: 15_000 },
  );
}
