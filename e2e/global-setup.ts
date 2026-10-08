import { execSync } from "node:child_process";
import pg from "pg";

/**
 * Brings the test database up to date without deleting data: applies pending
 * migrations and re-runs the idempotent seed (which restores the sample
 * offers). Tests create their own uniquely named users, so leftovers from
 * earlier runs never interfere. Only the rate-limit counters are cleared, so
 * repeated runs aren't throttled by the sign-up and login limits.
 */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL!, SEED_SAMPLE_DATA: "true" };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx prisma db seed", { stdio: "inherit", env });

  const client = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await client.connect();
  await client.query(`DELETE FROM "RateLimit"`);
  await client.end();
}
