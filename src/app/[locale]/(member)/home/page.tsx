import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon, type IconName } from "@/components/icon";
import { OfferCard, OfferTile } from "@/components/member/offer-card";
import { OfferVisual } from "@/components/member/offer-visual";
import { SearchBar } from "@/components/member/search-bar";
import { FeaturedBadge } from "@/components/member/featured-badge";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { requireActiveMember } from "@/lib/auth/guards";
import { formatDateTime, formatMoney, TIME_ZONE } from "@/lib/format";
import { getCategoriesWithCounts, getHomeOffers, getSavingsSummary, getZones } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/home">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Home" });
  return pageMetadata(locale, "/home", { title: t("metaTitle"), noindex: true });
}

function greetingKey(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  if (hour >= 5 && hour < 13) return "greetingMorning";
  if (hour >= 13 && hour < 20) return "greetingAfternoon";
  return "greetingEvening";
}

export default async function MemberHomePage({ params }: PageProps<"/[locale]/home">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const { user } = await requireActiveMember("/home");

  const [t, categories, zones, offers, savings] = await Promise.all([
    getTranslations("Home"),
    getCategoriesWithCounts(locale),
    getZones(locale),
    getHomeOffers(locale),
    getSavingsSummary(user.id),
  ]);
  const now = new Date();
  const [hero, ...side] = offers.featured;

  return (
    <div className="wrap flex flex-col gap-[clamp(32px,4vw,56px)] pt-6 pb-16 lg:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">{formatDateTime(locale, now, { weekday: "long", day: "numeric", month: "long" })}</span>
          <h1 className="text-[clamp(36px,5.6vw,72px)] font-extrabold">{t(greetingKey(now), { name: user.name.split(" ")[0] })}</h1>
        </div>
        {savings.count > 0 && (
          <Link href="/account#activity" className="flex items-center gap-4 rounded-full bg-white py-2.5 pr-6 pl-2.5 shadow-2">
            <span className="ci ci-sun [--s:56px]">
              <Icon name="sparkle" />
            </span>
            <span>
              <b className="block font-display text-lg text-deep">{t("saved", { amount: formatMoney(locale, savings.total) })}</b>
              <span className="text-[14px] text-mute">
                {t("savedDetail", {
                  count: savings.count,
                  date: formatDateTime(locale, savings.since ?? now, { month: "long", year: "numeric" }),
                })}
              </span>
            </span>
          </Link>
        )}
      </header>

      <SearchBar categories={categories} zones={zones} />

      <nav aria-label={t("categoriesLabel")}>
        <ul className="flex flex-wrap justify-center gap-y-6">
          {categories.map((c) => (
            <li key={c.slug} className="basis-1/3 sm:basis-1/5">
              <Link href={{ pathname: "/explore", query: { category: c.slug } }} className="cat-bubble">
                <span className={`ci ${c.tone}`}>
                  <Icon name={c.icon as IconName} />
                </span>
                <span className="text-[17px] sm:text-lg">{c.name}</span>
                <span className="-mt-1.5 text-[15px] font-semibold text-mute tabular-nums">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {hero ? (
        <section aria-labelledby="featured-title" className="flex flex-col gap-5">
          <span id="featured-title" className="eyebrow">
            {t("featuredEyebrow")}
          </span>
          <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
            <Link
              href={`/offers/${hero.slug}`}
              className="art relative block min-h-[340px] overflow-hidden rounded-[34px] shadow-2 lg:min-h-[440px]"
            >
              <OfferVisual artKind={hero.artKind} image={hero.image} alt="" size="full" priority />
              <div className="absolute top-4 right-4 sm:top-auto sm:right-10 sm:bottom-10">
                <FeaturedBadge discount={hero.discount} label={t("exclusive")} />
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-[26px] bg-deep/55 p-5 text-white backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-6 sm:pr-40">
                <div className="min-w-0">
                  <span className="text-[13px] font-bold tracking-[0.14em] uppercase opacity-85">
                    {hero.category.name} · {hero.neighbourhood}
                  </span>
                  <h2 className="mt-1 text-[clamp(26px,3vw,40px)] font-extrabold text-white">{hero.venueName}</h2>
                  <p className="mt-1 text-[16px] opacity-90">
                    {hero.title} · {hero.summary}
                  </p>
                </div>
              </div>
            </Link>
            <ul className="flex flex-col gap-4">
              {side.map((o) => (
                <li key={o.slug} className="min-w-0">
                  <OfferCard offer={o} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="latest-title" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">{t("latestEyebrow")}</span>
            <h2 id="latest-title" className="h2">
              {t("latestTitle")}
            </h2>
          </div>
          <Link href="/explore" className="btn btn-ghost">
            {t("seeAll")}
            <Icon name="arrow" className="size-5" />
          </Link>
        </div>
        {offers.latest.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {offers.latest.map((o) => (
              <li key={o.slug}>
                <OfferTile offer={o} />
              </li>
            ))}
          </ul>
        ) : (
          !hero && (
            <div className="rounded-[30px] bg-white p-8 text-center shadow-1">
              <h3 className="text-2xl font-bold">{t("emptyTitle")}</h3>
              <p className="mt-2 text-mute">{t("emptyText")}</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}
