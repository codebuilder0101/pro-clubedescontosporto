import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/routing";
import { requireActiveMember } from "@/lib/auth/guards";
import { pickTranslation } from "@/lib/content-locale";
import { db } from "@/lib/db";
import type { DiscountLike } from "@/lib/discount";
import { offerImageUrls } from "@/lib/media";
import { escapeLike, SEARCH_PAGE_SIZE, searchTerms, type SearchQuery } from "@/lib/search-params";

// Member-only offer data. Every exported function that returns offer details
// calls requireActiveMember() itself, so a page that forgets the check still
// can't leak content (CLAUDE.md rule 1).

/** Published and inside its optional date window. */
function liveOfferWhere(now = new Date()): Prisma.OfferWhereInput {
  return {
    status: "PUBLISHED",
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

const named = { select: { locale: true, name: true } } as const;

const cardSelect = {
  id: true,
  slug: true,
  featured: true,
  discountType: true,
  discountValue: true,
  artKind: true,
  images: { select: { fileName: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  translations: { select: { locale: true, title: true, summary: true, badge: true } },
  venue: {
    select: { name: true, neighbourhood: true, zone: { select: { slug: true, translations: named } } },
  },
  category: { select: { slug: true, icon: true, tone: true, translations: named } },
} satisfies Prisma.OfferSelect;

type CardRow = Prisma.OfferGetPayload<{ select: typeof cardSelect }>;

export type CategoryInfo = { slug: string; name: string; icon: string; tone: string };

export type OfferCard = {
  slug: string;
  venueName: string;
  title: string;
  summary: string;
  neighbourhood: string;
  zoneName: string;
  category: CategoryInfo;
  discount: DiscountLike;
  artKind: string;
  /** Cover photo (first image), or null to show the illustration. */
  image: { src: string; thumb: string } | null;
  featured: boolean;
  isFavorite: boolean;
};

function nameIn(rows: readonly { locale: string; name: string }[], locale: Locale): string {
  return pickTranslation(rows, locale)?.name ?? "";
}

function toDiscount(row: { discountType: CardRow["discountType"]; discountValue: Prisma.Decimal | null }, badge?: string | null): DiscountLike {
  return {
    discountType: row.discountType,
    discountValue: row.discountValue === null ? null : row.discountValue.toNumber(),
    badge: badge ?? null,
  };
}

function toCard(row: CardRow, locale: Locale, favorites: ReadonlySet<string> = new Set()): OfferCard {
  const tr = pickTranslation(row.translations, locale);
  return {
    slug: row.slug,
    venueName: row.venue.name,
    title: tr?.title ?? "",
    summary: tr?.summary ?? "",
    neighbourhood: row.venue.neighbourhood,
    zoneName: nameIn(row.venue.zone.translations, locale),
    category: {
      slug: row.category.slug,
      icon: row.category.icon,
      tone: row.category.tone,
      name: nameIn(row.category.translations, locale),
    },
    discount: toDiscount(row, tr?.badge),
    artKind: row.artKind,
    image: row.images[0] ? offerImageUrls(row.images[0].fileName) : null,
    featured: row.featured,
    isFavorite: favorites.has(row.id),
  };
}

export type CategoryWithCount = CategoryInfo & { count: number };

/** Categories with live-offer counts. Counts are public; this returns no offer data. */
export async function getCategoriesWithCounts(locale: Locale): Promise<CategoryWithCount[]> {
  const [categories, counts] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, icon: true, tone: true, translations: named } }),
    db.offer.groupBy({ by: ["categoryId"], where: liveOfferWhere(), _count: { _all: true } }),
  ]);
  const byId = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  return categories.map((c) => ({
    slug: c.slug,
    icon: c.icon,
    tone: c.tone,
    name: nameIn(c.translations, locale),
    count: byId.get(c.id) ?? 0,
  }));
}

export type ZoneInfo = { slug: string; name: string };

export async function getZones(locale: Locale): Promise<ZoneInfo[]> {
  const zones = await db.zone.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, translations: named } });
  return zones.map((z) => ({ slug: z.slug, name: nameIn(z.translations, locale) }));
}

/** Which of these offers the member has saved. */
async function favoriteSet(userId: string, offerIds: string[]): Promise<Set<string>> {
  if (!offerIds.length) return new Set();
  const rows = await db.favorite.findMany({ where: { userId, offerId: { in: offerIds } }, select: { offerId: true } });
  return new Set(rows.map((r) => r.offerId));
}

/** Member home: featured offers first, then the newest ones. */
export async function getHomeOffers(locale: Locale) {
  const { user } = await requireActiveMember();
  const [featured, latest] = await Promise.all([
    db.offer.findMany({
      where: { ...liveOfferWhere(), featured: true },
      orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
      take: 4,
      select: cardSelect,
    }),
    db.offer.findMany({
      where: { ...liveOfferWhere(), featured: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: cardSelect,
    }),
  ]);
  const favs = await favoriteSet(user.id, [...featured, ...latest].map((r) => r.id));
  return { featured: featured.map((r) => toCard(r, locale, favs)), latest: latest.map((r) => toCard(r, locale, favs)) };
}

export type SearchResult = { offers: OfferCard[]; total: number; page: number; pageCount: number };

/**
 * Search by text (venue, neighbourhood, city, offer copy, category and zone
 * names in every language), category and zone. Each word must match, either
 * as an accent-insensitive substring or a close trigram match (typos).
 */
export async function searchOffers(query: SearchQuery, locale: Locale): Promise<SearchResult> {
  const { user } = await requireActiveMember();
  const now = new Date();
  const terms = searchTerms(query.q);

  const filters: Prisma.Sql[] = [
    Prisma.sql`o."status" = 'PUBLISHED'`,
    Prisma.sql`(o."startsAt" IS NULL OR o."startsAt" <= ${now})`,
    Prisma.sql`(o."endsAt" IS NULL OR o."endsAt" > ${now})`,
  ];
  if (query.category) filters.push(Prisma.sql`c."slug" = ${query.category}`);
  if (query.zone) filters.push(Prisma.sql`z."slug" = ${query.zone}`);

  const matches = terms.map(
    (t) =>
      Prisma.sql`(d.doc LIKE '%' || f_unaccent(${escapeLike(t)}) || '%' OR f_unaccent(${t}) <% d.doc)`,
  );
  const rank = terms.length
    ? Prisma.sql`word_similarity(f_unaccent(${terms.join(" ")}), d.vname) DESC,`
    : Prisma.empty;
  const offset = (query.page - 1) * SEARCH_PAGE_SIZE;

  const rows = await db.$queryRaw<{ id: string; total: number }[]>`
    WITH d AS (
      SELECT o."id", o."featured", o."createdAt",
        f_unaccent(lower(v."name")) AS vname,
        f_unaccent(lower(concat_ws(' ',
          v."name", v."neighbourhood", v."city",
          (SELECT string_agg(concat_ws(' ', ot."title", ot."summary", ot."description", ot."badge"), ' ')
             FROM "OfferTranslation" ot WHERE ot."offerId" = o."id"),
          (SELECT string_agg(ct."name", ' ') FROM "CategoryTranslation" ct WHERE ct."categoryId" = c."id"),
          (SELECT string_agg(zt."name", ' ') FROM "ZoneTranslation" zt WHERE zt."zoneId" = z."id")
        ))) AS doc
      FROM "Offer" o
      JOIN "Venue" v ON v."id" = o."venueId"
      JOIN "Category" c ON c."id" = o."categoryId"
      JOIN "Zone" z ON z."id" = v."zoneId"
      WHERE ${Prisma.join(filters, " AND ")}
    )
    SELECT d."id", (count(*) OVER ())::int AS total
    FROM d
    WHERE ${matches.length ? Prisma.join(matches, " AND ") : Prisma.sql`TRUE`}
    ORDER BY ${rank} d."featured" DESC, d."createdAt" DESC, d."id"
    LIMIT ${SEARCH_PAGE_SIZE} OFFSET ${offset}`;

  const total = rows[0]?.total ?? 0;
  const ids = rows.map((r) => r.id);
  const found = ids.length ? await db.offer.findMany({ where: { id: { in: ids } }, select: cardSelect }) : [];
  const byId = new Map(found.map((r) => [r.id, r]));
  const favs = await favoriteSet(user.id, ids);
  const offers = ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toCard(row, locale, favs)] : [];
  });

  return { offers, total, page: query.page, pageCount: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)) };
}

export type OfferDetail = OfferCard & {
  images: { src: string; thumb: string; width: number; height: number }[];
  description: string;
  schedule: string | null;
  conditions: string[];
  maxPeople: number | null;
  venue: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    neighbourhood: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    website: string | null;
  };
};

/** Full offer for its detail page, or null if it doesn't exist or isn't live. */
export async function getOffer(slug: string, locale: Locale): Promise<OfferDetail | null> {
  const { user } = await requireActiveMember();
  const row = await db.offer.findFirst({
    // Admins can preview drafts and scheduled offers.
    where: user.role === "ADMIN" ? { slug } : { slug, ...liveOfferWhere() },
    select: {
      ...cardSelect,
      images: { select: { fileName: true, width: true, height: true }, orderBy: { sortOrder: "asc" } },
      maxPeople: true,
      translations: {
        select: { locale: true, title: true, summary: true, badge: true, description: true, schedule: true, conditions: true },
      },
      venue: {
        select: {
          name: true,
          address: true,
          postalCode: true,
          city: true,
          neighbourhood: true,
          latitude: true,
          longitude: true,
          phone: true,
          website: true,
          zone: { select: { slug: true, translations: named } },
        },
      },
    },
  });
  if (!row) return null;
  const tr = pickTranslation(row.translations, locale);
  const { zone, ...venue } = row.venue;
  const favs = await favoriteSet(user.id, [row.id]);
  return {
    ...toCard(row, locale, favs),
    images: row.images.map((i) => ({ ...offerImageUrls(i.fileName), width: i.width, height: i.height })),
    description: tr?.description ?? "",
    schedule: tr?.schedule ?? null,
    conditions: tr?.conditions ?? [],
    maxPeople: row.maxPeople,
    zoneName: nameIn(zone.translations, locale),
    venue,
  };
}

/** The member's saved offers that are still live, newest first. */
export async function getFavoriteOffers(locale: Locale): Promise<OfferCard[]> {
  const { user } = await requireActiveMember();
  const rows = await db.favorite.findMany({
    where: { userId: user.id, offer: liveOfferWhere() },
    orderBy: { createdAt: "desc" },
    select: { offer: { select: cardSelect } },
  });
  const favs = new Set(rows.map((r) => r.offer.id));
  return rows.map((r) => toCard(r.offer, locale, favs));
}

export type SavingsSummary = { total: number; count: number; since: Date | null };

/** What the member has recorded saving with the club. */
export async function getSavingsSummary(userId: string): Promise<SavingsSummary> {
  const agg = await db.redemption.aggregate({
    where: { userId },
    _sum: { savedAmount: true },
    _count: { _all: true },
    _min: { createdAt: true },
  });
  return { total: agg._sum.savedAmount?.toNumber() ?? 0, count: agg._count._all, since: agg._min.createdAt };
}
