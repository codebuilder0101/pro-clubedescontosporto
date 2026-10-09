import Form from "next/form";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Empty, PageHeader, Pagination, pageParam, qs, strParam } from "@/components/admin/admin-ui";
import { FormAlert } from "@/components/form/field";
import { Icon } from "@/components/icon";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { listVenues } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/venues">) {
  return adminMetadata((await params).locale, "/admin/venues", "venues");
}

export default async function AdminVenues({ params, searchParams }: PageProps<"/[locale]/admin/venues">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const sp = await searchParams;
  const q = strParam(sp.q);
  const page = pageParam(sp.page);
  const [t, ta, list] = await Promise.all([getTranslations("Admin.venues"), getTranslations("Admin"), listVenues(q, page, locale)]);

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/admin/venues/new" className="btn btn-sun">
            <Icon name="plus" className="size-5" />
            {t("new")}
          </Link>
        }
      />
      {sp.deleted === "1" && (
        <div className="mb-4">
          <FormAlert tone="ok">{ta("deleted")}</FormAlert>
        </div>
      )}
      <Form action={getPathname({ locale: await getLocale(), href: "/admin/venues" })} className="admin-card mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="v-q" className="a-label">
            {ta("search")}
          </label>
          <input id="v-q" name="q" type="search" defaultValue={q} className="a-input" placeholder={t("searchPlaceholder")} />
        </div>
        <button type="submit" className="btn btn-blue !min-h-[48px]">
          {ta("filter")}
        </button>
      </Form>
      <p className="mb-3 font-bold text-mute">{t("count", { count: list.total })}</p>
      {list.rows.length ? (
        <ul className="admin-card flex flex-col !p-2">
          {list.rows.map((v) => (
            <li key={v.id}>
              <Link href={`/admin/venues/${v.id}`} className="row-link">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-deep">{v.name}</b>
                  <span className="block truncate text-[14px] text-mute">
                    {v.neighbourhood}, {v.city} · {v.zone}
                  </span>
                </span>
                <span className="text-[14px] font-bold text-cobalt">{t("offers", { count: v._count.offers })}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
      <Pagination page={page} pageCount={list.pageCount} href={(p) => `/admin/venues${qs({ q, page: p })}`} />
    </>
  );
}
