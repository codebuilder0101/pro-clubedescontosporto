import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/taxonomy-forms";
import { adminMetadata } from "@/lib/admin/metadata";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/categories/new">) {
  return adminMetadata((await params).locale, "/admin/categories/new", "categories");
}

export default async function NewCategory({ params }: PageProps<"/[locale]/admin/categories/new">) {
  setRequestLocale((await params).locale);
  await requireAdmin();
  const t = await getTranslations("Admin.taxonomy");
  return (
    <>
      <PageHeader eyebrow={t("categories")} title={t("newCategory")} />
      <CategoryForm category={{ slug: "", icon: "star", tone: "ci-sky", sortOrder: 10, names: {} }} />
    </>
  );
}
