import { getTranslations, setRequestLocale } from "next-intl/server";
import { Empty, PageHeader, StatusBadge, strParam } from "@/components/admin/admin-ui";
import { PartnerRequestForm } from "@/components/admin/member-forms";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { listPartnerRequests } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/partner-requests">) {
  return adminMetadata((await params).locale, "/admin/partner-requests", "partnerRequests");
}

export default async function AdminPartnerRequests({ params, searchParams }: PageProps<"/[locale]/admin/partner-requests">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const status = strParam((await searchParams).status);
  const [t, ta, rows] = await Promise.all([getTranslations("Admin.requests"), getTranslations("Admin"), listPartnerRequests(status || undefined)]);

  return (
    <>
      <PageHeader title={t("title")} />
      <nav aria-label={t("filter")} className="mb-5 flex flex-wrap gap-2">
        {["", "NEW", "CONTACTED", "ACCEPTED", "REJECTED"].map((s) => (
          <Link key={s || "all"} href={s ? `/admin/partner-requests?status=${s}` : "/admin/partner-requests"} className="chip" aria-current={status === s ? "true" : undefined}>
            {s ? ta(`status.${s}`) : ta("all")}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.id} id={r.id} className="admin-card flex scroll-mt-[calc(var(--nav-h)+16px)] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="flex-1 text-xl font-bold">{r.businessName}</h2>
                <StatusBadge status={r.status} />
                <span className="text-[14px] font-bold text-mute">{formatDateTime(locale as Locale, r.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <p className="text-[15px] font-semibold text-deep">
                {r.contactName} ·{" "}
                <a href={`mailto:${r.email}`} className="text-cobalt underline">
                  {r.email}
                </a>
                {r.phone && (
                  <>
                    {" · "}
                    <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="text-cobalt underline">
                      {r.phone}
                    </a>
                  </>
                )}
              </p>
              <p className="text-[14px] font-bold text-mute">
                {r.city}
                {r.categorySlug ? ` · ${r.categorySlug}` : ""} · {r.locale}
              </p>
              <p className="rounded-2xl bg-linen p-4 whitespace-pre-line">{r.message}</p>
              <PartnerRequestForm id={r.id} status={r.status} notes={r.notes ?? ""} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
    </>
  );
}
