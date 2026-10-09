import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { DeleteForm } from "@/components/admin/taxonomy-forms";
import { VenueForm } from "@/components/admin/venue-form";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getFormOptions, getVenue } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { pickTranslation } from "@/lib/content-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/venues/[id]">) {
  const { locale, id } = await params;
  return adminMetadata(locale, `/admin/venues/${id}`, "venues");
}

export default async function EditVenue({ params, searchParams }: PageProps<"/[locale]/admin/venues/[id]">) {
  const { locale: raw, id } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const [t, venue, options] = await Promise.all([getTranslations("Admin.venues"), getVenue(id), getFormOptions(locale)]);
  if (!venue) notFound();

  return (
    <>
      <PageHeader eyebrow={t("title")} title={venue.name} />
      <div className="flex flex-col gap-6">
        <VenueForm
          saved={(await searchParams).saved === "1"}
          zones={options.zones.map((z) => ({ value: z.id, label: z.label }))}
          venue={{ ...venue, phone: venue.phone ?? "", website: venue.website ?? "" }}
        />
        <section className="admin-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{t("offersTitle")}</h2>
            <Link href={`/admin/offers/new?venue=${venue.id}`} className="btn btn-ghost !min-h-[46px] !px-4 !text-[15px]">
              <Icon name="plus" className="size-5" />
              {t("addOffer")}
            </Link>
          </div>
          {venue.offers.length ? (
            <ul className="flex flex-col">
              {venue.offers.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/offers/${o.id}`} className="row-link">
                    <span className="flex-1 font-bold text-deep">{pickTranslation(o.translations, locale)?.title ?? o.slug}</span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mute">{t("noOffers")}</p>
          )}
        </section>
        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold text-bad">{t("dangerTitle")}</h2>
          <p className="text-[15px] text-mute">{t("dangerText")}</p>
          <DeleteForm kind="venue" id={venue.id} message={t("confirmDelete")} />
        </section>
      </div>
    </>
  );
}
