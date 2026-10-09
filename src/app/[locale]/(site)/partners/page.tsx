import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon, type IconName } from "@/components/icon";
import { PartnerForm } from "@/components/partners/partner-form";
import { routing, type Locale } from "@/i18n/routing";
import { getCategoriesWithCounts } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/partners">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Partners" });
  return { ...pageMetadata(locale, "/partners", { title: t("metaTitle") }), description: t("lead") };
}

// Static page; only the category list comes from the database.
export const revalidate = 3600;

export default async function PartnersPage({ params }: PageProps<"/[locale]/partners">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const [t, categories] = await Promise.all([getTranslations("Partners"), getCategoriesWithCounts(locale)]);

  const perks: { icon: IconName; tone: string; title: string; text: string }[] = [
    { icon: "euro", tone: "ci-sun", title: t("perk1Title"), text: t("perk1Text") },
    { icon: "people", tone: "", title: t("perk2Title"), text: t("perk2Text") },
    { icon: "sparkle", tone: "ci-leaf", title: t("perk3Title"), text: t("perk3Text") },
  ];

  return (
    <section className="sec">
      <div className="wrap grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[clamp(38px,5.4vw,68px)] font-extrabold">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <ul className="flex flex-col gap-3">
            {perks.map((p) => (
              <li key={p.title} className="fact">
                <span className={`ci ${p.tone}`}>
                  <Icon name={p.icon} />
                </span>
                <span>
                  <b className="block text-[17px] text-deep">{p.title}</b>
                  <span className="text-[15px] text-mute">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-panel relative">
          <h2 className="mb-5 text-[clamp(26px,3vw,34px)] font-extrabold">{t("formTitle")}</h2>
          <PartnerForm categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
        </div>
      </div>
    </section>
  );
}
