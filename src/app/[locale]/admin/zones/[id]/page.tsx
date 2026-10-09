import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { DeleteForm, ZoneForm } from "@/components/admin/taxonomy-forms";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getZone } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { pickTranslation } from "@/lib/content-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/zones/[id]">) {
  const { locale, id } = await params;
  return adminMetadata(locale, `/admin/zones/${id}`, "zones");
}

export default async function EditZone({ params, searchParams }: PageProps<"/[locale]/admin/zones/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const [t, zone] = await Promise.all([getTranslations("Admin.taxonomy"), getZone(id)]);
  if (!zone) notFound();
  return (
    <>
      <PageHeader eyebrow={t("zones")} title={pickTranslation(zone.translations, locale as Locale)?.name ?? zone.slug} />
      <div className="flex flex-col gap-6">
        <ZoneForm
          saved={(await searchParams).saved === "1"}
          zone={{ id: zone.id, slug: zone.slug, sortOrder: zone.sortOrder, names: Object.fromEntries(zone.translations.map((x) => [x.locale, x.name])) }}
        />
        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold text-bad">{t("dangerTitle")}</h2>
          <p className="text-[15px] text-mute">{t("deleteZoneText", { count: zone._count.venues })}</p>
          <DeleteForm kind="zone" id={zone.id} message={t("confirmDelete")} />
        </section>
      </div>
    </>
  );
}
