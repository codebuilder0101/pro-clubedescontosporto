import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getDashboardStats } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">) {
  return adminMetadata((await params).locale, "/admin", "dashboard");
}

export default async function AdminDashboard({ params }: PageProps<"/[locale]/admin">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const [t, s] = await Promise.all([getTranslations("Admin.dashboard"), getDashboardStats(locale)]);

  const tiles = [
    { label: t("activeMembers"), value: s.activeMembers, detail: t("activeDetail", { monthly: s.paidMonthly, yearly: s.paidYearly, manual: s.manual }) },
    { label: t("mrr"), value: formatMoney(locale, Math.round(s.mrr * 100) / 100), detail: t("mrrDetail") },
    { label: t("newMembers"), value: s.newMembers, detail: t("totalMembers", { count: s.totalMembers }) },
    { label: t("cancellations"), value: s.cancellations, detail: t("thisMonth") },
    { label: t("offers"), value: s.offers.published, detail: t("offersDetail", { draft: s.offers.draft, archived: s.offers.archived }) },
    { label: t("uses"), value: s.uses30, detail: t("usesDetail", { amount: formatMoney(locale, s.saved30) }) },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        actions={
          <Link href="/admin/offers/new" className="btn btn-sun">
            <Icon name="plus" className="size-5" />
            {t("newOffer")}
          </Link>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label} className="admin-card stat">
            <span>{tile.label}</span>
            <b>{tile.value}</b>
            <span className="!font-semibold">{tile.detail}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="admin-card">
          <h2 className="mb-3 text-xl font-bold">{t("topOffers")}</h2>
          {s.topOffers.length ? (
            <ol className="flex flex-col">
              {s.topOffers.map((o, i) => (
                <li key={o.id}>
                  <Link href={`/admin/offers/${o.id}`} className="row-link">
                    <b className="w-6 text-mute">{i + 1}</b>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-deep">{o.venue}</b>
                      <span className="block truncate text-[14px] text-mute">{o.title}</span>
                    </span>
                    <span className="font-bold text-cobalt">{t("usesCount", { count: o.uses })}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-mute">{t("noUses")}</p>
          )}
        </section>
        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("requests")}</h2>
          <p className="text-mute">{t("requestsText", { count: s.newRequests })}</p>
          <Link href="/admin/partner-requests?status=NEW" className="btn btn-ghost self-start">
            <Icon name="inbox" className="size-5" />
            {t("openRequests")}
          </Link>
        </section>
      </div>
    </>
  );
}
