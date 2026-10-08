import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { Icon } from "./icon";

export type PlaceholderKey = "terms" | "privacy" | "cookies";

/**
 * Temporary page for routes the landing already links to but that are built
 * in later steps (auth, member area, legal). Not indexed.
 */
export function placeholderRoute(key: PlaceholderKey) {
  const href = `/${key}`;

  async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) return {};
    const t = await getTranslations({ locale, namespace: "Placeholder" });
    return pageMetadata(locale, href, { title: t(key), noindex: true });
  }

  async function Page({ params }: PageProps<"/[locale]">) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: "Placeholder" });
    return <Notice eyebrow={t("eyebrow")} heading={t(key)} title={t("title")} text={t("text")} back={t("back")} />;
  }

  return { generateMetadata, Page };
}

/** Centred message block shared by placeholder and 404 pages. */
export function Notice({
  eyebrow,
  heading,
  title,
  text,
  back,
}: {
  eyebrow: string;
  heading: string;
  title: string;
  text: string;
  back: string;
}) {
  return (
    <section className="sec">
      <div className="wrap flex flex-col items-center gap-5 text-center">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="text-[clamp(40px,6vw,76px)] font-extrabold">{heading}</h1>
        <p className="font-display text-[clamp(22px,2.4vw,30px)] font-bold text-cobalt">{title}</p>
        <p className="lead">{text}</p>
        <Link href="/" className="btn btn-sun mt-3 pr-3!">
          {back}
          <span className="btn-arrow bg-ink text-sun">
            <Icon name="arrow" className="size-5" strokeWidth={2.4} />
          </span>
        </Link>
      </div>
    </section>
  );
}
