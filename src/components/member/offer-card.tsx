import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDiscount } from "@/lib/discount";
import type { OfferCard as OfferCardData } from "@/lib/offers";
import { Icon } from "../icon";
import { FavoriteButton } from "./favorite-button";
import { OfferVisual } from "./offer-visual";

export function useDiscountLabel() {
  const locale = useLocale();
  const t = useTranslations("Offer");
  return (d: OfferCardData["discount"]) => formatDiscount(locale, d, { twoForOne: t("twoForOne") });
}

/**
 * Listing row: round art, discount badge, venue, area and one-line conditions.
 * The whole card is clickable through a stretched link; the heart button sits
 * above it (a button can't live inside a link).
 */
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const discount = useDiscountLabel();
  return (
    <article className="offer-card">
      <div className="art">
        <OfferVisual artKind={offer.artKind} image={offer.image} alt="" />
      </div>
      <span className="badge">{discount(offer.discount)}</span>
      <FavoriteButton slug={offer.slug} initial={offer.isFavorite} className="absolute top-3 right-3 z-20 !size-10" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-6 pr-8 sm:pt-4">
        <h3 className="text-[clamp(20px,2vw,26px)] font-bold">
          <Link href={`/offers/${offer.slug}`} className="after:absolute after:inset-0 after:z-10 after:rounded-[inherit] focus-visible:outline-none">
            {offer.venueName}
          </Link>
        </h3>
        <span className="meta">
          <Icon name="pin" />
          <span className="truncate">
            {offer.neighbourhood} · {offer.category.name}
          </span>
        </span>
        <p className="note-box">{offer.title}</p>
      </div>
    </article>
  );
}

/** Tall card for grids (home "new in the club"). */
export function OfferTile({ offer }: { offer: OfferCardData }) {
  const discount = useDiscountLabel();
  return (
    <article className="offer-tile relative flex h-full flex-col overflow-hidden rounded-[30px] bg-white shadow-1 transition-transform hover:-translate-y-1.5 hover:shadow-2">
      <div className="art relative aspect-[4/3]">
        <OfferVisual artKind={offer.artKind} image={offer.image} alt="" />
        <span className="tag">{discount(offer.discount)}</span>
      </div>
      <FavoriteButton slug={offer.slug} initial={offer.isFavorite} className="absolute top-3 right-3 z-20" />
      <div className="flex flex-col gap-1.5 px-5 pt-4 pb-5">
        <h3 className="text-[22px] font-bold">
          <Link href={`/offers/${offer.slug}`} className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none">
            {offer.venueName}
          </Link>
        </h3>
        <span className="meta">
          <Icon name="pin" />
          <span className="truncate">{offer.neighbourhood}</span>
        </span>
        <p className="text-[15px] font-semibold text-ink">{offer.title}</p>
      </div>
    </article>
  );
}
