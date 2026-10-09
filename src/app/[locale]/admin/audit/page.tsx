import { getTranslations, setRequestLocale } from "next-intl/server";
import { Empty, PageHeader, Pagination, pageParam, qs } from "@/components/admin/admin-ui";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { listAudit } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/audit">) {
  return adminMetadata((await params).locale, "/admin/audit", "audit");
}

export default async function AdminAudit({ params, searchParams }: PageProps<"/[locale]/admin/audit">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const page = pageParam((await searchParams).page);
  const [t, list] = await Promise.all([getTranslations("Admin.audit"), listAudit(page)]);
  return (
    <>
      <PageHeader title={t("title")} />
      <p className="mb-3 text-[15px] text-mute">{t("lead")}</p>
      {list.rows.length ? (
        <ul className="admin-card flex flex-col divide-y divide-line !py-2">
          {list.rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <span className="w-[150px] text-[14px] font-bold text-mute">{formatDateTime(locale as Locale, r.createdAt, { dateStyle: "short", timeStyle: "short" })}</span>
              <code className="rounded-md bg-linen px-2 py-0.5 text-[13px] font-bold text-deep">{r.action}</code>
              <span className="min-w-0 flex-1 break-words">{r.summary}</span>
              <span className="text-[14px] text-mute">{r.actor?.name ?? t("deletedUser")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
      <Pagination page={page} pageCount={list.pageCount} href={(p) => `/admin/audit${qs({ page: p })}`} />
    </>
  );
}
