import Form from "next/form";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Empty, PageHeader, Pagination, pageParam, qs, strParam } from "@/components/admin/admin-ui";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { listMembers, type MemberFilter } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import { formatMemberNumber } from "@/lib/membership";

const FILTERS: MemberFilter[] = ["all", "active", "inactive", "blocked", "admin"];

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/members">) {
  return adminMetadata((await params).locale, "/admin/members", "members");
}

export default async function AdminMembers({ params, searchParams }: PageProps<"/[locale]/admin/members">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const sp = await searchParams;
  const q = strParam(sp.q);
  const filterRaw = strParam(sp.filter) as MemberFilter;
  const filter = FILTERS.includes(filterRaw) ? filterRaw : "all";
  const page = pageParam(sp.page);
  const [t, ta, list] = await Promise.all([getTranslations("Admin.members"), getTranslations("Admin"), listMembers(q, filter, page)]);

  return (
    <>
      <PageHeader title={t("title")} />
      <Form action={getPathname({ locale: await getLocale(), href: "/admin/members" })} className="admin-card mb-5 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <div>
          <label htmlFor="m-q" className="a-label">
            {ta("search")}
          </label>
          <input id="m-q" name="q" type="search" defaultValue={q} className="a-input" placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <label htmlFor="m-filter" className="a-label">
            {t("filter")}
          </label>
          <select id="m-filter" name="filter" defaultValue={filter} className="a-input">
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {t(`filters.${f}`)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-blue !min-h-[48px]">
          {ta("filter")}
        </button>
      </Form>
      <p className="mb-3 font-bold text-mute">{t("count", { count: list.total })}</p>
      {list.rows.length ? (
        <ul className="admin-card flex flex-col !p-2">
          {list.rows.map((m) => {
            const sub = m.subscriptions[0];
            return (
              <li key={m.id}>
                <Link href={`/admin/members/${m.id}`} className="row-link">
                  <span className="min-w-0 flex-1 basis-[220px]">
                    <b className="block truncate text-deep">{m.name}</b>
                    <span className="block truncate text-[14px] text-mute">
                      {m.email} · CP {formatMemberNumber(m.memberNumber)}
                    </span>
                  </span>
                  {m.role === "ADMIN" && <span className="status status-ADMIN">{t("admin")}</span>}
                  {m.blockedAt && <span className="status status-BLOCKED">{t("blocked")}</span>}
                  {sub ? (
                    <span className="status status-ACTIVE">
                      {ta(`plan.${sub.plan}`)} · {ta(`provider.${sub.provider}`)}
                    </span>
                  ) : (
                    <span className="status status-CANCELED">{t("noPass")}</span>
                  )}
                  <span className="text-[13px] font-bold text-mute">{formatDateTime(locale, m.createdAt, { dateStyle: "medium" })}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
      <Pagination page={page} pageCount={list.pageCount} href={(p) => `/admin/members${qs({ q, filter: filter === "all" ? undefined : filter, page: p })}`} />
    </>
  );
}
