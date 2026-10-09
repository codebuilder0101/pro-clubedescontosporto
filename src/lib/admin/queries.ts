import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/guards";
import { pickTranslation } from "@/lib/content-locale";
import { db } from "@/lib/db";
import { ACCESS_STATUSES, STRIPE_GRACE_MS } from "@/lib/membership";
import { MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR } from "@/lib/pricing";

// Backoffice reads. Every export calls requireAdmin() itself, like the member
// data layer calls requireActiveMember().

export const ADMIN_PAGE_SIZE = 25;

const named = { select: { locale: true, name: true } } as const;
const nameIn = (rows: readonly { locale: string; name: string }[], locale: Locale) => pickTranslation(rows, locale)?.name ?? "";

function activeSubscriptionWhere(now = new Date()): Prisma.SubscriptionWhereInput {
  return {
    status: { in: [...ACCESS_STATUSES] },
    OR: [
      { provider: "MANUAL", currentPeriodEnd: { gt: now } },
      { provider: "STRIPE", currentPeriodEnd: { gt: new Date(now.getTime() - STRIPE_GRACE_MS) } },
    ],
  };
}

function startOfMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// ---------- Dashboard ----------

export async function getDashboardStats(locale: Locale) {
  await requireAdmin();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const since30 = new Date(now.getTime() - 30 * 86_400_000);

  const [activeSubs, newMembers, totalMembers, cancellations, offersByStatus, newRequests, uses30, saved30, topUses] = await Promise.all([
    db.subscription.findMany({ where: activeSubscriptionWhere(now), select: { userId: true, plan: true, provider: true } }),
    db.user.count({ where: { createdAt: { gte: monthStart } } }),
    db.user.count(),
    db.subscription.count({ where: { provider: "STRIPE", status: "CANCELED", updatedAt: { gte: monthStart } } }),
    db.offer.groupBy({ by: ["status"], _count: { _all: true } }),
    db.partnerRequest.count({ where: { status: "NEW" } }),
    db.redemption.count({ where: { createdAt: { gte: since30 } } }),
    db.redemption.aggregate({ where: { createdAt: { gte: since30 } }, _sum: { savedAmount: true } }),
    db.redemption.groupBy({ by: ["offerId"], where: { createdAt: { gte: since30 } }, _count: { _all: true }, orderBy: { _count: { offerId: "desc" } }, take: 5 }),
  ]);

  // One row per member (a member can have a manual grant and a paid plan).
  const byUser = new Map<string, { plan: string; provider: string }>();
  for (const s of activeSubs) if (!byUser.has(s.userId) || s.provider === "STRIPE") byUser.set(s.userId, s);
  const members = [...byUser.values()];
  const paidMonthly = members.filter((m) => m.provider === "STRIPE" && m.plan === "MONTHLY").length;
  const paidYearly = members.filter((m) => m.provider === "STRIPE" && m.plan === "YEARLY").length;

  const topOffers = topUses.length
    ? await db.offer.findMany({
        where: { id: { in: topUses.map((t) => t.offerId) } },
        select: { id: true, slug: true, venue: { select: { name: true } }, translations: { select: { locale: true, title: true } } },
      })
    : [];

  const status = Object.fromEntries(offersByStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
  return {
    activeMembers: members.length,
    paidMonthly,
    paidYearly,
    manual: members.filter((m) => m.provider === "MANUAL").length,
    mrr: paidMonthly * MONTHLY_PRICE_EUR + (paidYearly * YEARLY_PRICE_EUR) / 12,
    newMembers,
    totalMembers,
    cancellations,
    offers: { published: status.PUBLISHED ?? 0, draft: status.DRAFT ?? 0, archived: status.ARCHIVED ?? 0 },
    newRequests,
    uses30,
    saved30: saved30._sum.savedAmount?.toNumber() ?? 0,
    topOffers: topUses.map((t) => {
      const o = topOffers.find((x) => x.id === t.offerId);
      return {
        id: t.offerId,
        venue: o?.venue.name ?? "—",
        title: o ? (pickTranslation(o.translations, locale)?.title ?? "") : "",
        uses: t._count._all,
      };
    }),
  };
}

// ---------- Offers ----------

export type OfferListFilter = { q?: string; status?: string; category?: string; page: number };

export async function listOffers(filter: OfferListFilter, locale: Locale) {
  await requireAdmin();
  const where: Prisma.OfferWhereInput = {
    ...(filter.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(filter.status) ? { status: filter.status as "DRAFT" } : {}),
    ...(filter.category ? { category: { slug: filter.category } } : {}),
    ...(filter.q
      ? {
          OR: [
            { slug: { contains: filter.q, mode: "insensitive" } },
            { venue: { name: { contains: filter.q, mode: "insensitive" } } },
            { translations: { some: { title: { contains: filter.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.offer.count({ where }),
    db.offer.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (filter.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        status: true,
        featured: true,
        discountType: true,
        discountValue: true,
        startsAt: true,
        endsAt: true,
        updatedAt: true,
        venue: { select: { name: true } },
        category: { select: { translations: named } },
        translations: { select: { locale: true, title: true, summary: true, description: true } },
        _count: { select: { images: true, redemptions: true, favorites: true } },
      },
    }),
  ]);
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    rows: rows.map((r) => ({
      ...r,
      discountValue: r.discountValue?.toNumber() ?? null,
      title: pickTranslation(r.translations, locale)?.title ?? "",
      category: nameIn(r.category.translations, locale),
      complete: completeLocales(r.translations),
    })),
  };
}

/** Locales whose translation has title, summary and description. */
export function completeLocales(rows: readonly { locale: string; title: string; summary: string; description: string }[]): string[] {
  return rows.filter((t) => t.title && t.summary && t.description).map((t) => t.locale);
}

export async function getOfferForEdit(id: string) {
  await requireAdmin();
  const offer = await db.offer.findUnique({
    where: { id },
    include: {
      translations: true,
      images: { orderBy: { sortOrder: "asc" } },
      _count: { select: { redemptions: true, favorites: true } },
    },
  });
  if (!offer) return null;
  return { ...offer, discountValue: offer.discountValue?.toNumber() ?? null };
}

/** Choices for the offer and venue forms. */
export async function getFormOptions(locale: Locale) {
  await requireAdmin();
  const [venues, categories, zones] = await Promise.all([
    db.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, neighbourhood: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, translations: named } }),
    db.zone.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, translations: named } }),
  ]);
  return {
    venues: venues.map((v) => ({ id: v.id, label: `${v.name} · ${v.neighbourhood}` })),
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, label: nameIn(c.translations, locale) })),
    zones: zones.map((z) => ({ id: z.id, slug: z.slug, label: nameIn(z.translations, locale) })),
  };
}

// ---------- Venues ----------

export async function listVenues(q: string, page: number, locale: Locale) {
  await requireAdmin();
  const where: Prisma.VenueWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { neighbourhood: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const [total, rows] = await Promise.all([
    db.venue.count({ where }),
    db.venue.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        neighbourhood: true,
        city: true,
        zone: { select: { translations: named } },
        _count: { select: { offers: true } },
      },
    }),
  ]);
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    rows: rows.map((r) => ({ ...r, zone: nameIn(r.zone.translations, locale) })),
  };
}

export async function getVenue(id: string) {
  await requireAdmin();
  return db.venue.findUnique({
    where: { id },
    include: { offers: { select: { id: true, slug: true, status: true, translations: { select: { locale: true, title: true } } } } },
  });
}

// ---------- Categories & zones ----------

export async function listCategories(locale: Locale) {
  await requireAdmin();
  const rows = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, icon: true, tone: true, sortOrder: true, translations: named, _count: { select: { offers: true } } },
  });
  return rows.map((r) => ({ ...r, name: nameIn(r.translations, locale), locales: r.translations.map((t) => t.locale) }));
}

export async function getCategory(id: string) {
  await requireAdmin();
  return db.category.findUnique({ where: { id }, include: { translations: true, _count: { select: { offers: true } } } });
}

export async function listZones(locale: Locale) {
  await requireAdmin();
  const rows = await db.zone.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, sortOrder: true, translations: named, _count: { select: { venues: true } } },
  });
  return rows.map((r) => ({ ...r, name: nameIn(r.translations, locale), locales: r.translations.map((t) => t.locale) }));
}

export async function getZone(id: string) {
  await requireAdmin();
  return db.zone.findUnique({ where: { id }, include: { translations: true, _count: { select: { venues: true } } } });
}

// ---------- Members ----------

export type MemberFilter = "all" | "active" | "inactive" | "blocked" | "admin";

export async function listMembers(q: string, filter: MemberFilter, page: number) {
  await requireAdmin();
  const now = new Date();
  const search: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { memberNumber: { contains: q.replace(/\D/g, "") || q } },
        ],
      }
    : {};
  const byFilter: Prisma.UserWhereInput =
    filter === "active"
      ? { subscriptions: { some: activeSubscriptionWhere(now) } }
      : filter === "inactive"
        ? { subscriptions: { none: activeSubscriptionWhere(now) } }
        : filter === "blocked"
          ? { blockedAt: { not: null } }
          : filter === "admin"
            ? { role: "ADMIN" }
            : {};
  const where: Prisma.UserWhereInput = { AND: [search, byFilter] };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        memberNumber: true,
        role: true,
        blockedAt: true,
        createdAt: true,
        subscriptions: { where: activeSubscriptionWhere(now), select: { plan: true, provider: true }, take: 1 },
      },
    }),
  ]);
  return { total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), rows };
}

export async function getMember(id: string) {
  await requireAdmin();
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      memberNumber: true,
      role: true,
      preferredLocale: true,
      stripeCustomerId: true,
      blockedAt: true,
      createdAt: true,
      subscriptions: { orderBy: { createdAt: "desc" } },
      _count: { select: { favorites: true, redemptions: true, sessions: true } },
    },
  });
  if (!user) return null;
  const saved = await db.redemption.aggregate({ where: { userId: id }, _sum: { savedAmount: true } });
  return { ...user, saved: saved._sum.savedAmount?.toNumber() ?? 0 };
}

// ---------- Partner requests & audit ----------

export async function listPartnerRequests(status: string | undefined) {
  await requireAdmin();
  const valid = status && ["NEW", "CONTACTED", "ACCEPTED", "REJECTED"].includes(status);
  return db.partnerRequest.findMany({
    where: valid ? { status: status as "NEW" } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listAudit(page: number) {
  await requireAdmin();
  const [total, rows] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
      select: { id: true, action: true, entityId: true, summary: true, createdAt: true, actor: { select: { name: true, email: true } } },
    }),
  ]);
  return { total, pageCount: Math.max(1, Math.ceil(total / 50)), rows };
}

