import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { ZoneForm } from "@/components/admin/taxonomy-forms";
import { adminMetadata } from "@/lib/admin/metadata";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/zones/new">) {
  return adminMetadata((await params).locale, "/admin/zones/new", "zones");
}

export default async function NewZone({ params }: PageProps<"/[locale]/admin/zones/new">) {
  setRequestLocale((await params).locale);
  await requireAdmin();
  const t = await getTranslations("Admin.taxonomy");
  return (
    <>
      <PageHeader eyebrow={t("zones")} title={t("newZone")} />
      <ZoneForm zone={{ slug: "", sortOrder: 10, names: {} }} />
    </>
  );
}
