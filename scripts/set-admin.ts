/**
 * The backoffice has a single ADMIN role (decision 2026-10-09).
 *
 *   npm run admin:set -- <email>            make this account the admin
 *   npm run admin:set -- <email> --remove   back to a normal member
 *
 * Uses .env.local; prefix with NODE_ENV=production for the production database.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const [emailArg, flag] = process.argv.slice(2);
if (!emailArg) {
  console.error("Usage: npm run admin:set -- <email> [--remove]");
  process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: "-c TimeZone=UTC" }) });

async function main() {
  const email = emailArg.trim().toLowerCase();
  const role = flag === "--remove" ? "MEMBER" : "ADMIN";
  const user = await db.user.update({ where: { email }, data: { role }, select: { name: true, email: true, role: true } }).catch(() => null);
  if (!user) throw new Error(`No account with email ${email}`);
  console.log(`${user.name} <${user.email}> is now ${user.role}.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
