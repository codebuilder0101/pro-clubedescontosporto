import "server-only";
import { db } from "@/lib/db";
import { CATEGORY_SLUGS, ZONES, type CategorySlug, type ZoneId } from "@/lib/landing-data";

export type LandingStats = {
  partners: number;
  totalOffers: number;
  categories: Record<CategorySlug, number>;
  zones: Record<ZoneId, number>;
};

/**
 * Public aggregate counts for the landing page (no names, no details).
 * Counts published offers inside their date window.
 */
export async function getLandingStats(): Promise<LandingStats> {
  const rows = await db.$queryRaw<{ category: string; zone: string; venues: number; offers: number }[]>`
    SELECT c."slug" AS category, z."slug" AS zone,
           count(DISTINCT v."id")::int AS venues, count(*)::int AS offers
    FROM "Offer" o
    JOIN "Venue" v ON v."id" = o."venueId"
    JOIN "Category" c ON c."id" = o."categoryId"
    JOIN "Zone" z ON z."id" = v."zoneId"
    WHERE o."status" = 'PUBLISHED'
      AND (o."startsAt" IS NULL OR o."startsAt" <= now())
      AND (o."endsAt" IS NULL OR o."endsAt" > now())
    GROUP BY c."slug", z."slug"`;
  const [{ partners }] = await db.$queryRaw<{ partners: number }[]>`
    SELECT count(DISTINCT o."venueId")::int AS partners FROM "Offer" o
    WHERE o."status" = 'PUBLISHED'
      AND (o."startsAt" IS NULL OR o."startsAt" <= now())
      AND (o."endsAt" IS NULL OR o."endsAt" > now())`;

  const categories = Object.fromEntries(CATEGORY_SLUGS.map((s) => [s, 0])) as Record<CategorySlug, number>;
  const zones = Object.fromEntries(ZONES.map((z) => [z.id, 0])) as Record<ZoneId, number>;
  let totalOffers = 0;
  for (const r of rows) {
    if (r.category in categories) categories[r.category as CategorySlug] += r.offers;
    if (r.zone in zones) zones[r.zone as ZoneId] += r.offers;
    totalOffers += r.offers;
  }
  return { partners, totalOffers, categories, zones };
}
