import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { VenueForm } from "@/components/admin/venue-form";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getFormOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/venues/new">) {
  return adminMetadata((await params).locale, "/admin/venues/new", "venues");
}

export default async function NewVenue({ params }: PageProps<"/[locale]/admin/venues/new">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  await requireAdmin();
  const [t, options] = await Promise.all([getTranslations("Admin.venues"), getFormOptions(raw as Locale)]);
  return (
    <>
      <PageHeader eyebrow={t("title")} title={t("new")} />
      <VenueForm
        zones={options.zones.map((z) => ({ value: z.id, label: z.label }))}
        venue={{ name: "", address: "", postalCode: "", city: "Porto", neighbourhood: "", zoneId: "", latitude: null, longitude: null, phone: "", website: "" }}
      />
    </>
  );
}
