import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ImageManager } from "@/components/admin/image-manager";
import { OfferForm } from "@/components/admin/offer-form";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { deleteOffer, duplicateOffer } from "@/lib/actions/admin/offers";
import { adminMetadata } from "@/lib/admin/metadata";
import { getFormOptions, getOfferForEdit } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { offerImageUrls } from "@/lib/media";
import { dateToLisbonInput } from "@/lib/timezone";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/offers/[id]">) {
  const { locale, id } = await params;
  return adminMetadata(locale, `/admin/offers/${id}`, "offers");
}

export default async function EditOffer({ params, searchParams }: PageProps<"/[locale]/admin/offers/[id]">) {
  const { locale: raw, id } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  await requireAdmin();
  const [t, ta, offer, options] = await Promise.all([getTranslations("Admin.offers"), getTranslations("Admin"), getOfferForEdit(id), getFormOptions(locale)]);
  if (!offer) notFound();
  const saved = (await searchParams).saved === "1";
  const venueLabel = options.venues.find((v) => v.id === offer.venueId)?.label ?? "";

  return (
    <>
      <PageHeader
        eyebrow={t("title")}
        title={venueLabel.split(" · ")[0] || offer.slug}
        actions={
          <>
            <StatusBadge status={offer.status} />
            <Link href={`/offers/${offer.slug}`} className="btn btn-ghost !min-h-[46px] !px-4 !text-[15px]" target="_blank">
              <Icon name="eye" className="size-5" />
              {t("preview")}
            </Link>
            <form action={duplicateOffer}>
              <input type="hidden" name="id" value={offer.id} />
              <button type="submit" className="btn btn-ghost !min-h-[46px] !px-4 !text-[15px]">
                <Icon name="plus" className="size-5" />
                {t("duplicate")}
              </button>
            </form>
          </>
        }
      />
      <p className="mb-5 text-[15px] font-bold text-mute">{t("usage", { uses: offer._count.redemptions, favorites: offer._count.favorites })}</p>
      <div className="flex flex-col gap-6">
        <OfferForm
          saved={saved}
          venues={options.venues.map((v) => ({ value: v.id, label: v.label }))}
          categories={options.categories.map((c) => ({ value: c.id, label: c.label }))}
          offer={{
            id: offer.id,
            slug: offer.slug,
            venueId: offer.venueId,
            categoryId: offer.categoryId,
            status: offer.status,
            featured: offer.featured,
            featuredOrder: offer.featuredOrder,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            maxPeople: offer.maxPeople,
            artKind: offer.artKind,
            startsAt: offer.startsAt ? dateToLisbonInput(offer.startsAt) : "",
            endsAt: offer.endsAt ? dateToLisbonInput(offer.endsAt) : "",
            translations: Object.fromEntries(
              locales.flatMap((l) => {
                const tr = offer.translations.find((x) => x.locale === l);
                return tr
                  ? [[l, { title: tr.title, summary: tr.summary, description: tr.description, schedule: tr.schedule ?? "", conditions: tr.conditions.join("\n"), badge: tr.badge ?? "" }]]
                  : [];
              }),
            ),
          }}
        />
        <ImageManager offerId={offer.id} images={offer.images.map((img) => ({ id: img.id, thumb: offerImageUrls(img.fileName).thumb }))} />
        <section className="admin-card flex flex-col gap-3">
          <h2 className="text-xl font-bold text-bad">{t("dangerTitle")}</h2>
          <p className="text-[15px] text-mute">{t("dangerText")}</p>
          <form action={deleteOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <ConfirmSubmit message={t("confirmDelete")} className="btn bg-[#fbe7e3] !text-bad">
              <Icon name="trash" className="size-5" />
              {ta("delete")}
            </ConfirmSubmit>
          </form>
        </section>
      </div>
    </>
  );
}
