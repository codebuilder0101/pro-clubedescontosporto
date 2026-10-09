import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { GrantForm } from "@/components/admin/member-forms";
import { Icon } from "@/components/icon";
import type { Locale } from "@/i18n/routing";
import { revokeManualAccess, setBlocked } from "@/lib/actions/admin/members";
import { adminMetadata } from "@/lib/admin/metadata";
import { getMember } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateTime, formatMoney } from "@/lib/format";
import { formatMemberNumber } from "@/lib/membership";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/members/[id]">) {
  const { locale, id } = await params;
  return adminMetadata(locale, `/admin/members/${id}`, "members");
}

export default async function AdminMember({ params }: PageProps<"/[locale]/admin/members/[id]">) {
  const { locale: raw, id } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const admin = await requireAdmin();
  const [t, ta, m] = await Promise.all([getTranslations("Admin.members"), getTranslations("Admin"), getMember(id)]);
  if (!m) notFound();
  const date = (d: Date) => formatDateTime(locale, d, { dateStyle: "medium" });
  const stripeMode = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live") ? "" : "test/";
  const hasManual = m.subscriptions.some((s) => s.provider === "MANUAL" && s.status === "ACTIVE" && s.currentPeriodEnd > new Date());

  const facts: [string, string][] = [
    [t("email"), m.email],
    [t("memberNumber"), `CP ${formatMemberNumber(m.memberNumber)}`],
    [t("language"), m.preferredLocale],
    [t("since"), date(m.createdAt)],
    [t("favorites"), String(m._count.favorites)],
    [t("uses"), `${m._count.redemptions} · ${formatMoney(locale, m.saved)}`],
    [t("devices"), String(m._count.sessions)],
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("title")}
        title={m.name}
        actions={
          <>
            {m.role === "ADMIN" && <span className="status status-ADMIN">{t("admin")}</span>}
            {m.blockedAt && <span className="status status-BLOCKED">{t("blocked")}</span>}
          </>
        }
      />
      <div className="flex flex-col gap-6">
        <section className="admin-card">
          <dl className="grid gap-4 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="a-label">{k}</dt>
                <dd className="font-bold break-words text-deep">{v}</dd>
              </div>
            ))}
          </dl>
          {m.stripeCustomerId && (
            <a href={`https://dashboard.stripe.com/${stripeMode}customers/${m.stripeCustomerId}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-4 !min-h-[46px] !px-4 !text-[15px]">
              <Icon name="external" className="size-5" />
              {t("openStripe")}
            </a>
          )}
        </section>

        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("subscriptions")}</h2>
          {m.subscriptions.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {m.subscriptions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <StatusBadge status={s.status} />
                  <b className="text-deep">
                    {ta(`plan.${s.plan}`)} · {ta(`provider.${s.provider}`)}
                  </b>
                  <span className="text-[14px] text-mute">{t("until", { date: date(s.currentPeriodEnd) })}</span>
                  {s.cancelAtPeriodEnd && <span className="status status-NEW">{t("cancelScheduled")}</span>}
                  {s.note && <span className="text-[14px] text-mute">· {s.note}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mute">{t("noSubscriptions")}</p>
          )}
          <p className="a-hint">{t("stripeHint")}</p>
        </section>

        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("grantTitle")}</h2>
          <p className="text-[15px] text-mute">{t("grantText")}</p>
          <GrantForm userId={m.id} />
          {hasManual && (
            <form action={revokeManualAccess}>
              <input type="hidden" name="userId" value={m.id} />
              <ConfirmSubmit message={t("confirmRevoke")} className="btn btn-ghost !min-h-[46px]">
                {t("revoke")}
              </ConfirmSubmit>
            </form>
          )}
        </section>

        {m.id !== admin.id && (
          <section className="admin-card flex flex-col gap-3">
            <h2 className="text-xl font-bold text-bad">{m.blockedAt ? t("unblockTitle") : t("blockTitle")}</h2>
            <p className="text-[15px] text-mute">{m.blockedAt ? t("unblockText") : t("blockText")}</p>
            <form action={setBlocked}>
              <input type="hidden" name="userId" value={m.id} />
              <input type="hidden" name="block" value={m.blockedAt ? "0" : "1"} />
              <ConfirmSubmit message={m.blockedAt ? t("confirmUnblock") : t("confirmBlock")} className={`btn ${m.blockedAt ? "btn-ghost" : "bg-[#fbe7e3] !text-bad"}`}>
                {m.blockedAt ? t("unblock") : t("block")}
              </ConfirmSubmit>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
