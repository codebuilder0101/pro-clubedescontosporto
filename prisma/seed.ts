// `npx prisma db seed`
//
// Always upserts reference data (categories, zones). Sample offers (fictional
// venues) are added outside production, or in production only with
// SEED_SAMPLE_DATA=true. Demo accounts share a public password, so they are
// never created in production.
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateMemberNumber } from "../src/lib/member-number";
import { categories, sampleOffers, zones, type L10n } from "./seed-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: "-c TimeZone=UTC" }) });

const withSamples =
  process.env.SEED_SAMPLE_DATA === "true" ||
  (process.env.SEED_SAMPLE_DATA !== "false" && process.env.NODE_ENV !== "production");

const withDemoAccounts = withSamples && process.env.NODE_ENV !== "production";

/** Password of every demo account (development and e2e only). */
export const DEMO_PASSWORD = "Porto-2026!";

const DAY = 24 * 60 * 60 * 1000;

function entries<T>(l10n: L10n<T>) {
  return Object.entries(l10n) as [keyof L10n, T][];
}

async function seedReferenceData() {
  for (const [i, c] of categories.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { icon: c.icon, tone: c.tone, sortOrder: i },
      create: { slug: c.slug, icon: c.icon, tone: c.tone, sortOrder: i },
    });
    for (const [locale, name] of entries(c.name)) {
      await db.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: row.id, locale } },
        update: { name },
        create: { categoryId: row.id, locale, name },
      });
    }
  }
  for (const [i, z] of zones.entries()) {
    const row = await db.zone.upsert({
      where: { slug: z.slug },
      update: { sortOrder: i },
      create: { slug: z.slug, sortOrder: i },
    });
    for (const [locale, name] of entries(z.name)) {
      await db.zoneTranslation.upsert({
        where: { zoneId_locale: { zoneId: row.id, locale } },
        update: { name },
        create: { zoneId: row.id, locale, name },
      });
    }
  }
}

async function seedSampleOffers() {
  const categoryIds = new Map((await db.category.findMany()).map((c) => [c.slug, c.id]));
  const zoneIds = new Map((await db.zone.findMany()).map((z) => [z.slug, z.id]));

  for (const o of sampleOffers) {
    const venueData = { ...o.venue, zoneId: zoneIds.get(o.zone)! };
    const existing = await db.offer.findUnique({ where: { slug: o.slug }, select: { venueId: true } });
    const venue = existing
      ? await db.venue.update({ where: { id: existing.venueId }, data: venueData })
      : await db.venue.create({ data: venueData });

    const offerData = {
      venueId: venue.id,
      categoryId: categoryIds.get(o.category)!,
      status: "PUBLISHED" as const,
      featured: o.featured ?? false,
      discountType: o.discount.type,
      discountValue: o.discount.value ?? null,
      maxPeople: o.maxPeople ?? null,
      artKind: o.art,
    };
    const offer = await db.offer.upsert({
      where: { slug: o.slug },
      update: offerData,
      create: { slug: o.slug, ...offerData },
    });
    for (const [locale, copy] of entries(o.copy)) {
      await db.offerTranslation.upsert({
        where: { offerId_locale: { offerId: offer.id, locale } },
        update: copy,
        create: { offerId: offer.id, locale, ...copy },
      });
    }
  }
}

/**
 * Demo accounts:
 *   member@example.com   active (manual grant, 1 year)
 *   expired@example.com  subscription ended yesterday
 *   nosub@example.com    signed up, never paid
 */
async function seedDemoAccounts() {
  const passwordHash = await hash(DEMO_PASSWORD);
  const now = Date.now();
  const accounts = [
    { email: "member@example.com", name: "Rita Fernandes", periodEnd: new Date(now + 365 * DAY) },
    { email: "expired@example.com", name: "João Expirado", periodEnd: new Date(now - DAY) },
    { email: "nosub@example.com", name: "Ana Sem Plano", periodEnd: null },
  ];
  for (const a of accounts) {
    const user = await db.user.upsert({
      where: { email: a.email },
      update: { name: a.name, passwordHash },
      create: {
        email: a.email,
        name: a.name,
        passwordHash,
        memberNumber: generateMemberNumber(),
        termsAcceptedAt: new Date(),
      },
    });
    await db.subscription.deleteMany({ where: { userId: user.id, provider: "MANUAL" } });
    if (a.periodEnd) {
      await db.subscription.create({
        data: {
          userId: user.id,
          provider: "MANUAL",
          plan: "YEARLY",
          status: a.periodEnd.getTime() > now ? "ACTIVE" : "CANCELED",
          currentPeriodEnd: a.periodEnd,
          note: "Demo account (seed)",
        },
      });
    }
  }
}

async function main() {
  await seedReferenceData();
  console.log(`Seeded ${categories.length} categories and ${zones.length} zones.`);
  if (withSamples) {
    await seedSampleOffers();
    console.log(`Seeded ${sampleOffers.length} sample offers.`);
  } else {
    console.log("Sample offers skipped.");
  }
  if (withDemoAccounts) {
    await seedDemoAccounts();
    console.log(`Seeded 3 demo accounts (password: ${DEMO_PASSWORD}).`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
