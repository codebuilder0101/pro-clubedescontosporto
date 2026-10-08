import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JoinSteps } from "@/components/auth/join-steps";
import { RefreshUntilActive } from "@/components/auth/refresh-until-active";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getActiveSubscription, requireUser } from "@/lib/auth/guards";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/join/welcome">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Welcome" });
  return pageMetadata(locale, "/join/welcome", { title: t("metaTitle"), noindex: true });
}

/**
 * Stripe sends the member here after Checkout. Access is granted only by the
 * webhook, so this page just reads our database and refreshes until the
 * subscription shows up as active.
 */
export default async function WelcomePage({ params }: PageProps<"/[locale]/join/welcome">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/join/welcome");
  const active = await getActiveSubscription(user.id);
  const t = await getTranslations("Welcome");

  return (
    <>
      <div className="mb-6">
        <JoinSteps current={active ? 3 : 2} />
      </div>
      <div className="flex flex-col items-start gap-4" aria-live="polite">
        <span className="eyebrow">{t("eyebrow")}</span>
        {active ? (
          <>
            <span className="ci ci-leaf [--s:72px]">
              <Icon name="check" />
            </span>
            <h1 className="text-[clamp(32px,4vw,46px)] font-extrabold">{t("activeTitle", { name: user.name.split(" ")[0] })}</h1>
            <p className="text-[17px] text-mute">{t("activeText")}</p>
            <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
              <Link href="/card" className="btn btn-sun flex-1">
                <Icon name="card" className="size-5" />
                {t("openCard")}
              </Link>
              <Link href="/home" className="btn btn-ghost flex-1">
                {t("explore")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="ci ci-sun animate-spin-slow [--s:72px]">
              <Icon name="clock" />
            </span>
            <h1 className="text-[clamp(32px,4vw,46px)] font-extrabold">{t("pendingTitle")}</h1>
            <p className="text-[17px] text-mute">{t("pendingText")}</p>
            <RefreshUntilActive slowMessage={t("pendingSlow")} />
          </>
        )}
      </div>
    </>
  );
}
