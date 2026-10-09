import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { CategoryForm, DeleteForm } from "@/components/admin/taxonomy-forms";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getCategory } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { pickTranslation } from "@/lib/content-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/categories/[id]">) {
  const { locale, id } = await params;
  return adminMetadata(locale, `/admin/categories/${id}`, "categories");
}

export default async function EditCategory({ params, searchParams }: PageProps<"/[locale]/admin/categories/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const [t, cat] = await Promise.all([getTranslations("Admin.taxonomy"), getCategory(id)]);
  if (!cat) notFound();
  return (
    <>
      <PageHeader eyebrow={t("categories")} title={pickTranslation(cat.translations, locale as Locale)?.name ?? cat.slug} />
      <div className="flex flex-col gap-6">
        <CategoryForm
          saved={(await searchParams).saved === "1"}
          category={{ id: cat.id, slug: cat.slug, icon: cat.icon, tone: cat.tone, sortOrder: cat.sortOrder, names: Object.fromEntries(cat.translations.map((x) => [x.locale, x.name])) }}
        />
        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold text-bad">{t("dangerTitle")}</h2>
          <p className="text-[15px] text-mute">{t("deleteCategoryText", { count: cat._count.offers })}</p>
          <DeleteForm kind="category" id={cat.id} message={t("confirmDelete")} />
        </section>
      </div>
    </>
  );
}
