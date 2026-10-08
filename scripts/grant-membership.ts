/**
 * Manual (complimentary) access until the Phase 2 backoffice exists.
 *
 *   npm run member:grant -- <email> <days> ["reason"]   give access for N days
 *   npm run member:grant -- <email> --revoke           end manual access now
 *
 * Paid subscriptions are never touched: they change only through Stripe webhooks.
 * Uses .env.local; prefix with NODE_ENV=production to target the production database.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const [emailArg, second, note] = process.argv.slice(2);
if (!emailArg || !second) {
  console.error('Usage: npm run member:grant -- <email> <days> ["reason"] | <email> --revoke');
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: "-c TimeZone=UTC" }) });

async function main() {
  const email = emailArg.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) throw new Error(`No account with email ${email}`);

  if (second === "--revoke") {
    const { count } = await db.subscription.updateMany({
      where: { userId: user.id, provider: "MANUAL", status: "ACTIVE" },
      data: { status: "CANCELED", currentPeriodEnd: new Date() },
    });
    console.log(`Revoked ${count} manual grant(s) for ${user.name} <${email}>.`);
    return;
  }

  const days = Number(second);
  if (!Number.isInteger(days) || days < 1 || days > 3660) throw new Error("<days> must be a whole number between 1 and 3660");
  const until = new Date(Date.now() + days * 86_400_000);
  await db.subscription.create({
    data: {
      userId: user.id,
      provider: "MANUAL",
      plan: days >= 365 ? "YEARLY" : "MONTHLY",
      status: "ACTIVE",
      currentPeriodEnd: until,
      note: note ?? "Manual grant (CLI)",
    },
  });
  console.log(`${user.name} <${email}> has access until ${until.toISOString()}.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
