import { getTranslations, setRequestLocale } from "next-intl/server";
import { LangChips, PageHeader } from "@/components/admin/admin-ui";
import { FormAlert } from "@/components/form/field";
import { Icon, type IconName } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { listCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/categories">) {
  return adminMetadata((await params).locale, "/admin/categories", "categories");
}

export default async function AdminCategories({ params, searchParams }: PageProps<"/[locale]/admin/categories">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  await requireAdmin();
  const [t, ta, rows] = await Promise.all([getTranslations("Admin.taxonomy"), getTranslations("Admin"), listCategories(raw as Locale)]);
  return (
    <>
      <PageHeader
        title={t("categories")}
        actions={
          <Link href="/admin/categories/new" className="btn btn-sun">
            <Icon name="plus" className="size-5" />
            {t("newCategory")}
          </Link>
        }
      />
      {(await searchParams).deleted === "1" && (
        <div className="mb-4">
          <FormAlert tone="ok">{ta("deleted")}</FormAlert>
        </div>
      )}
      <ul className="admin-card flex flex-col !p-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/categories/${c.id}`} className="row-link">
              <span className={`ci ${c.tone} [--s:44px]`}>
                <Icon name={c.icon as IconName} />
              </span>
              <span className="flex-1">
                <b className="block text-deep">{c.name}</b>
                <span className="text-[14px] text-mute">/{c.slug}</span>
              </span>
              <LangChips present={c.locales} />
              <span className="text-[14px] font-bold text-cobalt">{t("offerCount", { count: c._count.offers })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

