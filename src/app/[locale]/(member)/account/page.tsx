import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeleteAccountForm, EmailForm, PasswordForm, ProfileForm } from "@/components/account/account-forms";
import { FormAlert } from "@/components/form/field";
import { Icon } from "@/components/icon";
import { initials } from "@/components/member/member-shell";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { revokeOtherSessions, revokeSession } from "@/lib/actions/account";
import { signOut } from "@/lib/actions/auth";
import { openBillingPortal } from "@/lib/actions/billing";
import { getActiveSubscription, getLatestSubscription, requireUser } from "@/lib/auth/guards";
import { currentSessionId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { formatMemberNumber } from "@/lib/membership";
import { getSavingsSummary } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";
import { PAYMENT_ISSUE_STATUSES } from "@/lib/stripe";
import { describeUserAgent } from "@/lib/user-agent";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Account" });
  return pageMetadata(locale, "/account", { title: t("metaTitle"), noindex: true });
}

function Section({ id, title, icon, tone = "", children }: { id: string; title: string; icon: Parameters<typeof Icon>[0]["name"]; tone?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="auth-panel flex scroll-mt-[calc(var(--nav-h)+16px)] flex-col gap-5">
      <h2 id={`${id}-title`} className="flex items-center gap-3 text-2xl font-bold">
        <span className={`ci ${tone} [--s:44px]`} aria-hidden="true">
          <Icon name={icon} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Profile, subscription, activity, devices and privacy. */
export default async function AccountPage({ params, searchParams }: PageProps<"/[locale]/account">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const user = await requireUser("/account");
  const sp = await searchParams;

  const [t, ts, active, latest, savings, redemptions, sessions, thisSession] = await Promise.all([
    getTranslations("Account"),
    getTranslations("AccountSettings"),
    getActiveSubscription(user.id),
    getLatestSubscription(user.id),
    getSavingsSummary(user.id),
    db.redemption.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, savedAmount: true, offer: { select: { slug: true, venue: { select: { name: true } } } } },
    }),
    db.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true, userAgent: true, createdAt: true, lastUsedAt: true },
    }),
    currentSessionId(),
  ]);
  const date = (d: Date) => formatDateTime(locale, d, { dateStyle: "long" });
  const paymentIssue =
    !active && latest?.provider === "STRIPE" && (PAYMENT_ISSUE_STATUSES as readonly string[]).includes(latest.status);
  const canManage = Boolean(user.stripeCustomerId);

  return (
    <div className="wrap flex max-w-[880px] flex-col gap-6 pt-8 pb-16 lg:pt-12">
      <header className="flex items-center gap-5">
        <span className="avatar size-[72px]! text-2xl!" aria-hidden="true">
          {initials(user.name)}
        </span>
        <div className="flex flex-col gap-2">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[clamp(32px,4.6vw,56px)] font-extrabold">{t("title", { name: user.name.split(" ")[0] })}</h1>
          <p className="font-mono text-[15px] text-mute">CP {formatMemberNumber(user.memberNumber)}</p>
        </div>
      </header>

      <Section id="subscription" title={t("subscription")} icon="card" tone="ci-sun">
        {sp.billing === "unavailable" && <FormAlert tone="info">{ts("billingUnavailable")}</FormAlert>}
        {sp.billing === "error" && <FormAlert tone="bad">{ts("billingError")}</FormAlert>}
        {paymentIssue && (
          <div role="alert" className="flex flex-col gap-3 rounded-3xl bg-[#fbe7e3] p-5 text-[#8f2a1b]">
            <b className="flex items-center gap-2 text-lg">
              <Icon name="info" className="size-5" strokeWidth={2.4} />
              {ts("paymentFailedTitle")}
            </b>
            <p>{ts("paymentFailedText")}</p>
          </div>
        )}
        {active ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="ci ci-leaf [--s:56px]">
              <Icon name="check" />
            </span>
            <div className="flex-1">
              <b className="block text-lg text-deep">{t(`plan${active.plan}`)}</b>
              <span className="text-mute">
                {active.cancelAtPeriodEnd || active.provider === "MANUAL"
                  ? t("ends", { date: date(active.currentPeriodEnd) })
                  : t("renews", { date: date(active.currentPeriodEnd) })}
              </span>
            </div>
            <span className="rounded-full bg-[#dff3e9] px-3 py-1 text-sm font-extrabold text-ok">{t("active")}</span>
          </div>
        ) : (
          !paymentIssue && (
            <div className="flex flex-wrap items-center gap-4">
              <span className="ci ci-slate [--s:56px]">
                <Icon name="lock" />
              </span>
              <p className="flex-1 font-bold text-deep">{t("noPlan")}</p>
              <Link href="/join" className="btn btn-sun">
                {t("activate")}
              </Link>
            </div>
          )
        )}
        {active?.cancelAtPeriodEnd && <FormAlert tone="info">{ts("cancelScheduled", { date: date(active.currentPeriodEnd) })}</FormAlert>}
        {canManage && (active?.provider === "STRIPE" || paymentIssue) && (
          <form action={openBillingPortal}>
            <button type="submit" className={`btn ${paymentIssue ? "btn-sun" : "btn-blue"}`}>
              <Icon name="external" className="size-5" />
              {paymentIssue ? ts("fixPayment") : ts("manage")}
            </button>
            <p className="mt-2 text-[14px] text-mute">{ts("manageHint")}</p>
          </form>
        )}
      </Section>

      <Section id="activity" title={ts("activity")} icon="sparkle" tone="ci-sun">
        {savings.count ? (
          <>
            <p className="font-display text-2xl font-bold text-deep">
              {ts("savedTotal", { amount: formatMoney(locale, savings.total), count: savings.count })}
            </p>
            <ul className="flex flex-col divide-y divide-line">
              {redemptions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    <Link href={`/offers/${r.offer.slug}`} className="font-bold text-deep hover:underline">
                      {r.offer.venue.name}
                    </Link>
                    <span className="block text-[14px] text-mute">{formatDateTime(locale, r.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                  </span>
                  <b className="text-ok tabular-nums">{r.savedAmount ? `-${formatMoney(locale, r.savedAmount.toNumber())}` : "—"}</b>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-mute">{ts("activityEmpty")}</p>
        )}
      </Section>

      <Section id="profile" title={t("profile")} icon="user" tone="ci-slate">
        <ProfileForm name={user.name} locale={user.preferredLocale as Locale} saved={sp.saved === "profile"} />
      </Section>

      <Section id="email" title={ts("emailTitle")} icon="mail">
        <EmailForm email={user.email} />
      </Section>

      <Section id="password" title={ts("passwordTitle")} icon="key" tone="ci-violet">
        <PasswordForm />
      </Section>

      <Section id="devices" title={ts("devices")} icon="phone" tone="ci-leaf">
        <ul className="flex flex-col divide-y divide-line">
          {sessions.map((s) => {
            const d = describeUserAgent(s.userAgent);
            const label = [d.browser, d.os].filter(Boolean).join(" · ") || ts("unknownDevice");
            const current = s.id === thisSession;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <b className="block text-deep">
                    {label}
                    {current && <span className="ml-2 rounded-full bg-tile px-2 py-0.5 text-[12px] font-extrabold text-cobalt">{ts("thisDevice")}</span>}
                  </b>
                  <span className="text-[14px] text-mute">{ts("lastActive", { date: formatDateTime(locale, s.lastUsedAt, { dateStyle: "medium", timeStyle: "short" }) })}</span>
                </span>
                {!current && (
                  <form action={revokeSession}>
                    <input type="hidden" name="sessionId" value={s.id} />
                    <button type="submit" className="text-[15px] font-extrabold text-bad hover:underline">
                      {ts("revoke")}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
        {sessions.length > 1 && (
          <form action={revokeOtherSessions}>
            <button type="submit" className="btn btn-ghost !h-auto !py-3 text-center !whitespace-normal">
              {ts("revokeOthers")}
            </button>
          </form>
        )}
      </Section>

      <Section id="privacy" title={ts("privacy")} icon="shield" tone="ci-wine">
        <div className="flex flex-col gap-2">
          <p className="text-[15px] text-mute">{ts("exportText")}</p>
          <a href="/api/account/export" className="btn btn-ghost self-start" download>
            <Icon name="download" className="size-5" />
            {ts("export")}
          </a>
        </div>
        <details className="rounded-3xl border border-line p-5">
          <summary className="cursor-pointer font-extrabold text-bad">{ts("deleteTitle")}</summary>
          <div className="mt-4">
            <DeleteAccountForm />
          </div>
        </details>
      </Section>

      <form action={signOut}>
        <button type="submit" className="btn btn-ghost">
          <Icon name="logout" className="size-5" />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}
