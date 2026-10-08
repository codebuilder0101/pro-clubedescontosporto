import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon, type IconName } from "@/components/icon";
import { OfferMap } from "@/components/member/offer-map";
import { OfferVisual } from "@/components/member/offer-visual";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { requireActiveMember } from "@/lib/auth/guards";
import { formatDiscount } from "@/lib/discount";
import { getOffer } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";

// The <title> is generic on purpose: offer names are member content and
// metadata is rendered before the page's access check redirects.
export async function generateMetadata({ params }: PageProps<"/[locale]/offers/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Offer" });
  return pageMetadata(locale, `/offers/${encodeURIComponent(slug)}`, { title: t("exclusive"), noindex: true });
}

export default async function OfferPage({ params }: PageProps<"/[locale]/offers/[slug]">) {
  const { locale: raw, slug } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  await requireActiveMember(`/offers/${slug}`);

  const offer = await getOffer(slug, locale);
  if (!offer) notFound();
  const t = await getTranslations("Offer");
  const discount = formatDiscount(locale, offer.discount, { twoForOne: t("twoForOne") });
  const { venue } = offer;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`;

  const facts: { icon: IconName; tone: string; title: string; detail?: string }[] = [];
  if (offer.schedule) facts.push({ icon: "cal", tone: "ci-sun", title: t("schedule"), detail: offer.schedule });
  if (offer.maxPeople) facts.push({ icon: "people", tone: "", title: t("people", { count: offer.maxPeople }), detail: t("peopleDetail") });
  for (const c of offer.conditions) facts.push({ icon: "info", tone: "ci-roof", title: c });

  const steps: { icon: IconName; tone: string; label: string }[] = [
    { icon: "euro", tone: "ci-sun", label: t("how1") },
    { icon: "card", tone: "", label: t("how2") },
    { icon: "check", tone: "ci-leaf", label: t("how3") },
  ];

  return (
    <div className="wrap pt-6 pb-16 lg:pt-10">
      <nav aria-label={t("breadcrumb")} className="mb-6 flex items-center gap-3 text-[16px] font-bold text-mute">
        <Link href={{ pathname: "/explore", query: { category: offer.category.slug } }} aria-label={t("back")} className="grid size-12 flex-none place-items-center rounded-full bg-white shadow-1">
          <Icon name="back" className="size-5 text-cobalt" strokeWidth={2.4} />
        </Link>
        <ol className="flex min-w-0 items-center gap-2">
          <li>
            <Link href={{ pathname: "/explore", query: { category: offer.category.slug } }} className="hover:text-deep">
              {offer.category.name}
            </Link>
          </li>
          <li aria-hidden="true">
            <Icon name="next" className="size-4" />
          </li>
          <li className="truncate text-deep" aria-current="page">
            {offer.venueName}
          </li>
        </ol>
      </nav>

      <div className="grid gap-[clamp(28px,4vw,56px)] lg:grid-cols-[1fr_1.05fr]">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
          <div className="art relative aspect-[4/3.4] overflow-hidden rounded-[34px_34px_34px_120px] shadow-2">
            <OfferVisual artKind={offer.artKind} imageUrl={offer.imageUrl} alt={offer.venueName} />
          </div>
        </div>

        <article className="flex flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-3">
              <span className="eyebrow">
                {offer.category.name} · {offer.neighbourhood}
              </span>
              <h1 className="text-[clamp(40px,5.4vw,72px)] font-extrabold">{offer.venueName}</h1>
            </div>
            <span className="disc-seal" data-long={discount.length > 5 ? "" : undefined} aria-label={`${t("exclusive")}: ${discount}`}>
              {discount}
            </span>
          </header>

          <p className="font-display text-[clamp(22px,2.4vw,30px)] font-bold text-cobalt">{offer.title}</p>
          <p className="lead">{offer.description}</p>

          {facts.length > 0 && (
            <section aria-label={t("conditions")}>
              <ul className="flex flex-col gap-3">
                {facts.map((f, i) => (
                  <li key={i} className="fact">
                    <span className={`ci ${f.tone}`}>
                      <Icon name={f.icon} />
                    </span>
                    <span>
                      <b className="block text-[17px] text-deep">{f.title}</b>
                      {f.detail && <span className="text-[15px] text-mute">{f.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="location-title" className="map-card">
            <h2 id="location-title" className="sr-only">
              {t("location")}
            </h2>
            <OfferMap latitude={venue.latitude} longitude={venue.longitude} label={t("mapLabel", { name: venue.name })} />
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <address className="not-italic">
                <b className="block text-deep">{venue.address}</b>
                <span className="text-[15px] text-mute">
                  {venue.postalCode} {venue.city}
                </span>
              </address>
              <div className="flex flex-wrap gap-2">
                {venue.phone && (
                  <a href={`tel:${venue.phone.replace(/\s+/g, "")}`} className="btn btn-ghost !min-h-[50px] !px-5 !text-base">
                    <Icon name="phone" className="size-5" />
                    {t("call")}
                  </a>
                )}
                {venue.website && (
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-[50px] !px-5 !text-base">
                    <Icon name="globe" className="size-5" />
                    {t("website")}
                  </a>
                )}
                <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-blue !min-h-[50px] !px-5 !text-base">
                  <Icon name="route" className="size-5" />
                  {t("directions")}
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="how-title" className="flex flex-col gap-4">
            <h2 id="how-title" className="text-[clamp(26px,2.6vw,34px)] font-extrabold">
              {t("howTitle")}
            </h2>
            <ol className="grid grid-cols-3 gap-3">
              {steps.map((s) => (
                <li key={s.label} className="howto">
                  <span className={`ci ${s.tone}`}>
                    <Icon name={s.icon} />
                  </span>
                  {s.label}
                </li>
              ))}
            </ol>
          </section>

          <Link href="/card" className="btn btn-sun">
            <Icon name="card" className="size-5" />
            {t("showCard")}
          </Link>
        </article>
      </div>
    </div>
  );
}
