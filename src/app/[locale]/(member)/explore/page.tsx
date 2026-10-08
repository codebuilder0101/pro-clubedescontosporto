import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OfferArt } from "@/components/art/offer-art";
import { Icon, type IconName } from "@/components/icon";
import { OfferCard } from "@/components/member/offer-card";
import { SearchBar } from "@/components/member/search-bar";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { requireActiveMember } from "@/lib/auth/guards";
import { getCategoriesWithCounts, getZones, searchOffers } from "@/lib/offers";
import { parseSearchQuery, type SearchQuery } from "@/lib/search-params";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/explore">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Explore" });
  return pageMetadata(locale, "/explore", { title: t("metaTitle"), noindex: true });
}

/** Query object for links, without empty values. */
function queryOf(q: Partial<SearchQuery>) {
  const out: Record<string, string> = {};
  if (q.q) out.q = q.q;
  if (q.category) out.category = q.category;
  if (q.zone) out.zone = q.zone;
  if (q.page && q.page > 1) out.page = String(q.page);
  return out;
}

const CATEGORY_ART: Record<string, "tasca" | "bar" | "evento" | "cultura" | "surf"> = {
  restaurants: "tasca",
  bars: "bar",
  events: "evento",
  culture: "cultura",
  leisure: "surf",
};

export default async function ExplorePage({ params, searchParams }: PageProps<"/[locale]/explore">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const query = parseSearchQuery(await searchParams);
  const nextQuery = new URLSearchParams(queryOf(query)).toString();
  await requireActiveMember(`/explore${nextQuery ? `?${nextQuery}` : ""}`);

  const [t, categories, zones, result] = await Promise.all([
    getTranslations("Explore"),
    getCategoriesWithCounts(locale),
    getZones(locale),
    searchOffers(query, locale),
  ]);
  const category = categories.find((c) => c.slug === query.category);
  const filtered = Boolean(query.q || query.category || query.zone);

  return (
    <div className="wrap flex flex-col gap-8 pt-6 pb-16 lg:pt-10">
      {category ? (
        <header className="art relative flex min-h-[200px] items-center overflow-hidden rounded-[34px] shadow-2 lg:min-h-[260px]">
          <OfferArt kind={CATEGORY_ART[category.slug] ?? "ribeira"} />
          <div className="absolute inset-0 bg-linear-to-r from-deep/85 via-deep/55 to-transparent" />
          <div className="relative z-10 flex items-center gap-5 px-6 py-8 sm:px-10">
            <span className={`ci ${category.tone} [--s:clamp(64px,10vw,140px)]`}>
              <Icon name={category.icon as IconName} />
            </span>
            <div className="flex min-w-0 flex-col gap-2 text-white">
              <span className="text-[14px] font-bold tracking-[0.14em] uppercase opacity-85">{t("categoryEyebrow")}</span>
              <h1 className="text-[clamp(30px,6vw,80px)] font-extrabold break-words text-white">{category.name}</h1>
              <p className="text-[17px] opacity-90">{t("categoryCount", { count: category.count })}</p>
            </div>
          </div>
        </header>
      ) : (
        <header className="flex flex-col gap-3">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[clamp(36px,5.6vw,72px)] font-extrabold">{t("title")}</h1>
        </header>
      )}

      <SearchBar categories={categories} zones={zones} defaults={{ q: query.q, category: query.category, zone: query.zone }} />

      <nav aria-label={t("zonesLabel")} className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)]">
        <ul className="flex gap-2.5 pb-1">
          <li>
            <Link href={{ pathname: "/explore", query: queryOf({ ...query, zone: undefined, page: 1 }) }} className="chip" aria-current={!query.zone ? "true" : undefined}>
              {t("allZones")}
            </Link>
          </li>
          {zones.map((z) => (
            <li key={z.slug}>
              <Link href={{ pathname: "/explore", query: queryOf({ ...query, zone: z.slug, page: 1 }) }} className="chip" aria-current={query.zone === z.slug ? "true" : undefined}>
                <Icon name="pin" className="size-4" />
                {z.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="results-title" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="results-title" className="font-sans text-lg font-bold tracking-normal text-mute" aria-live="polite">
            {query.q ? t("resultsFor", { count: result.total, q: query.q }) : t("results", { count: result.total })}
          </h2>
          {filtered && (
            <Link href="/explore" className="text-[15px] font-extrabold text-cobalt underline-offset-4 hover:underline">
              {t("clear")}
            </Link>
          )}
        </div>

        {result.offers.length ? (
          <ul className="grid gap-5 lg:grid-cols-2">
            {result.offers.map((o) => (
              <li key={o.slug} className="min-w-0">
                <OfferCard offer={o} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[30px] bg-white p-10 text-center shadow-1">
            <span className="ci ci-slate [--s:72px]">
              <Icon name="search" />
            </span>
            <h3 className="text-2xl font-bold">{t("emptyTitle")}</h3>
            <p className="text-mute">{t("emptyText")}</p>
            {filtered && (
              <Link href="/explore" className="btn btn-ghost mt-2">
                {t("clear")}
              </Link>
            )}
          </div>
        )}

        {result.pageCount > 1 && (
          <nav aria-label={t("pagination")} className="flex items-center justify-center gap-3 pt-4">
            {result.page > 1 && (
              <Link href={{ pathname: "/explore", query: queryOf({ ...query, page: result.page - 1 }) }} className="btn btn-ghost" rel="prev">
                <Icon name="back" className="size-5" />
                {t("prev")}
              </Link>
            )}
            <span className="font-bold text-mute">{t("page", { page: result.page, count: result.pageCount })}</span>
            {result.page < result.pageCount && (
              <Link href={{ pathname: "/explore", query: queryOf({ ...query, page: result.page + 1 }) }} className="btn btn-ghost" rel="next">
                {t("next")}
                <Icon name="next" className="size-5" />
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
