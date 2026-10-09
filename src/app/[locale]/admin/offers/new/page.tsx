import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/admin-ui";
import { OfferForm } from "@/components/admin/offer-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { getFormOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/offers/new">) {
  return adminMetadata((await params).locale, "/admin/offers/new", "offers");
}

export default async function NewOffer({ params, searchParams }: PageProps<"/[locale]/admin/offers/new">) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const venueParam = (await searchParams).venue;
  const [t, options] = await Promise.all([getTranslations("Admin.offers"), getFormOptions(locale)]);

  return (
    <>
      <PageHeader eyebrow={t("title")} title={t("new")} />
      {options.venues.length === 0 ? (
        <div className="admin-card flex flex-col items-start gap-3">
          <p className="font-bold text-deep">{t("needVenue")}</p>
          <Link href="/admin/venues/new" className="btn btn-sun">
            {t("createVenue")}
          </Link>
        </div>
      ) : (
        <OfferForm
          venues={options.venues.map((v) => ({ value: v.id, label: v.label }))}
          categories={options.categories.map((c) => ({ value: c.id, label: c.label }))}
          offer={{
            slug: "",
            venueId: typeof venueParam === "string" ? venueParam : "",
            categoryId: "",
            status: "DRAFT",
            featured: false,
            featuredOrder: 0,
            discountType: "PERCENT",
            discountValue: null,
            maxPeople: null,
            artKind: "ribeira",
            startsAt: "",
            endsAt: "",
            translations: {},
          }}
        />
      )}
    </>
  );
}
