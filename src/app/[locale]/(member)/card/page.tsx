import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon, type IconName } from "@/components/icon";
import { TiltStage } from "@/components/landing/tilt-stage";
import { LiveClock } from "@/components/member/live-clock";
import { MemberCard } from "@/components/member-card";
import { routing, type Locale } from "@/i18n/routing";
import { requireActiveMember } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import { formatMemberNumber } from "@/lib/membership";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/card">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Card" });
  return pageMetadata(locale, "/card", { title: t("metaTitle"), noindex: true });
}

export default async function CardPage({ params }: PageProps<"/[locale]/card">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const { user, subscription } = await requireActiveMember("/card");
  const t = await getTranslations("Card");

  const number = formatMemberNumber(user.memberNumber);
  const since = formatDateTime(locale, user.createdAt, { month: "2-digit", year: "numeric" });
  const validUntil = formatDateTime(locale, subscription.currentPeriodEnd, { dateStyle: "long" });

  const tips: { icon: IconName; tone: string; title: string; detail: string; soon?: boolean }[] = [
    { icon: "sun", tone: "ci-sun", title: t("tipBrightness"), detail: t("tipBrightnessDetail") },
    { icon: "phone", tone: "ci-leaf", title: t("tipOffline"), detail: t("tipOfflineDetail"), soon: true },
    { icon: "wallet", tone: "ci-slate", title: t("tipWallet"), detail: t("tipWalletDetail"), soon: true },
  ];

  return (
    <div className="wrap grid items-center gap-[clamp(32px,5vw,72px)] pt-8 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
      <div className="flex flex-col items-center gap-6">
        <TiltStage className="w-full max-w-[560px] [--rx:6deg] [--ry:-8deg] [--rz:-2deg] [perspective:1400px]">
          <div
            className="tilt-target"
            role="img"
            aria-label={t("cardLabel", { name: user.name, number, date: validUntil })}
          >
            <MemberCard name={user.name} number={`CP ${number}`} caption={t("memberSince", { date: since })} />
          </div>
        </TiltStage>
        <LiveClock label={t("clockLabel")} />
        <p className="-mt-3 font-bold text-mute">{t("validUntil", { date: validUntil })}</p>
      </div>

      <div className="flex flex-col gap-5">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="text-[clamp(40px,5.4vw,72px)] font-extrabold">{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <ul className="mt-2 flex flex-col gap-3">
          {tips.map((tip) => (
            <li key={tip.title} className="fact">
              <span className={`ci ${tip.tone}`}>
                <Icon name={tip.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[17px] text-deep">{tip.title}</b>
                <span className="text-[15px] text-mute">{tip.detail}</span>
              </span>
              {tip.soon && (
                <span className="rounded-full bg-[#FFF1C7] px-3 py-1 text-[12px] font-extrabold tracking-[0.12em] text-warn uppercase">
                  {t("soon")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
