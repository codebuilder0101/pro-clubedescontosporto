import Form from "next/form";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Empty, PageHeader, Pagination, pageParam, qs, StatusBadge, strParam } from "@/components/admin/admin-ui";
import { FormAlert } from "@/components/form/field";
import { Icon } from "@/components/icon";
import { getPathname, Link } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getFormOptions, listOffers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDiscount } from "@/lib/discount";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/offers">) {
  return adminMetadata((await params).locale, "/admin/offers", "offers");
}

export default async function AdminOffers({ params, searchParams }: PageProps<"/[locale]/admin/offers">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const sp = await searchParams;
  const filter = { q: strParam(sp.q), status: strParam(sp.status), category: strParam(sp.category), page: pageParam(sp.page) };
  const [t, ta, to, list, options] = await Promise.all([
    getTranslations("Admin.offers"),
    getTranslations("Admin"),
    getTranslations("Offer"),
    listOffers(filter, locale),
    getFormOptions(locale),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/admin/offers/new" className="btn btn-sun">
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
      <Form action={getPathname({ locale: await getLocale(), href: "/admin/offers" })} className="admin-card mb-5 grid gap-3 sm:grid-cols-[1fr_180px_180px_auto] sm:items-end">
        <div>
          <label htmlFor="f-q" className="a-label">
            {ta("search")}
          </label>
          <input id="f-q" name="q" type="search" defaultValue={filter.q} className="a-input" placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <label htmlFor="f-status" className="a-label">
            {t("status")}
          </label>
          <select id="f-status" name="status" defaultValue={filter.status} className="a-input">
            <option value="">{ta("all")}</option>
            {(["PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
              <option key={s} value={s}>
                {ta(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-cat" className="a-label">
            {t("category")}
          </label>
          <select id="f-cat" name="category" defaultValue={filter.category} className="a-input">
            <option value="">{ta("all")}</option>
            {options.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
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
          {list.rows.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/offers/${o.id}`} className="row-link">
                <span className="min-w-0 flex-1 basis-[240px]">
                  <b className="block truncate text-deep">{o.venue.name}</b>
                  <span className="block truncate text-[14px] text-mute">
                    {o.title} · {o.category}
                  </span>
                </span>
                <span className="badge !text-base">{formatDiscount(locale, o, { twoForOne: to("twoForOne") })}</span>
                <StatusBadge status={o.status} />
                {o.featured && <span className="status status-CONTACTED">★ {t("featured")}</span>}
                <span className="flex gap-1" aria-label={t("languages")}>
                  {locales.map((l) => (
                    <span key={l} className={`rounded-md px-1.5 text-[12px] font-extrabold ${o.complete.includes(l) ? "bg-[#dff3e9] text-ok" : "bg-[#fff1c7] text-warn"}`}>
                      {localeLabels[l]}
                    </span>
                  ))}
                </span>
                <span className="text-[13px] font-bold text-mute">
                  {t("stats", { photos: o._count.images, uses: o._count.redemptions, favorites: o._count.favorites })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
      <Pagination page={filter.page} pageCount={list.pageCount} href={(p) => `/admin/offers${qs({ q: filter.q, status: filter.status, category: filter.category, page: p })}`} />
    </>
  );
}
