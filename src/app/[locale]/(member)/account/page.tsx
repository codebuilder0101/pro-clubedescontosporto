import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/icon";
import { initials } from "@/components/member/member-shell";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { signOut } from "@/lib/actions/auth";
import { getActiveSubscription, requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import { formatMemberNumber } from "@/lib/membership";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Account" });
  return pageMetadata(locale, "/account", { title: t("metaTitle"), noindex: true });
}

/** Phase 1 account page: profile, subscription status, sign out. */
export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const user = await requireUser("/account");
  const subscription = await getActiveSubscription(user.id);
  const t = await getTranslations("Account");
  const date = (d: Date) => formatDateTime(locale, d, { dateStyle: "long" });

  const profile: [string, string][] = [
    [t("name"), user.name],
    [t("email"), user.email],
    [t("memberNumber"), `CP ${formatMemberNumber(user.memberNumber)}`],
    [t("memberSince"), date(user.createdAt)],
  ];

  return (
    <div className="wrap flex max-w-[880px] flex-col gap-8 pt-8 pb-16 lg:pt-12">
      <header className="flex items-center gap-5">
        <span className="avatar size-[72px]! text-2xl!" aria-hidden="true">
          {initials(user.name)}
        </span>
        <div className="flex flex-col gap-2">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[clamp(32px,4.6vw,56px)] font-extrabold">{t("title", { name: user.name.split(" ")[0] })}</h1>
        </div>
      </header>

      <section aria-labelledby="sub-title" className="auth-panel flex flex-col gap-4">
        <h2 id="sub-title" className="text-2xl font-bold">
          {t("subscription")}
        </h2>
        {subscription ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="ci ci-leaf [--s:56px]">
              <Icon name="check" />
            </span>
            <div className="flex-1">
              <b className="block text-lg text-deep">{t(`plan${subscription.plan}`)}</b>
              <span className="text-mute">
                {subscription.cancelAtPeriodEnd || subscription.provider === "MANUAL"
                  ? t("ends", { date: date(subscription.currentPeriodEnd) })
                  : t("renews", { date: date(subscription.currentPeriodEnd) })}
              </span>
            </div>
            <span className="rounded-full bg-[#dff3e9] px-3 py-1 text-sm font-extrabold text-ok">{t("active")}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <span className="ci ci-slate [--s:56px]">
              <Icon name="lock" />
            </span>
            <p className="flex-1 font-bold text-deep">{t("noPlan")}</p>
            <Link href="/join" className="btn btn-sun">
              {t("activate")}
            </Link>
          </div>
        )}
        <p className="text-[15px] text-mute">{t("manageSoon")}</p>
      </section>

      <section aria-labelledby="profile-title" className="auth-panel">
        <h2 id="profile-title" className="mb-4 text-2xl font-bold">
          {t("profile")}
        </h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {profile.map(([label, value]) => (
            <div key={label}>
              <dt className="field-label">{label}</dt>
              <dd className="font-bold break-words text-deep">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form action={signOut}>
        <button type="submit" className="btn btn-ghost">
          <Icon name="logout" className="size-5" />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}
