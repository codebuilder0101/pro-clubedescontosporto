import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/icon";
import { OfferCard } from "@/components/member/offer-card";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { requireActiveMember } from "@/lib/auth/guards";
import { getFavoriteOffers } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/favorites">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Favorites" });
  return pageMetadata(locale, "/favorites", { title: t("metaTitle"), noindex: true });
}

export default async function FavoritesPage({ params }: PageProps<"/[locale]/favorites">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireActiveMember("/favorites");
  const [t, offers] = await Promise.all([getTranslations("Favorites"), getFavoriteOffers(locale)]);

  return (
    <div className="wrap flex flex-col gap-8 pt-6 pb-16 lg:pt-10">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="text-[clamp(36px,5.6vw,72px)] font-extrabold">{t("title")}</h1>
        {offers.length > 0 && <p className="font-bold text-mute">{t("count", { count: offers.length })}</p>}
      </header>
      {offers.length ? (
        <ul className="grid gap-5 lg:grid-cols-2">
          {offers.map((o) => (
            <li key={o.slug} className="min-w-0">
              <OfferCard offer={o} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[30px] bg-white p-10 text-center shadow-1">
          <span className="ci ci-wine [--s:72px]">
            <Icon name="heart" />
          </span>
          <h2 className="text-2xl font-bold">{t("emptyTitle")}</h2>
          <p className="max-w-[46ch] text-mute">{t("emptyText")}</p>
          <Link href="/explore" className="btn btn-sun mt-2">
            {t("explore")}
          </Link>
        </div>
      )}
    </div>
  );
}
