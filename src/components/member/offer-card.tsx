import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDiscount } from "@/lib/discount";
import type { OfferCard as OfferCardData } from "@/lib/offers";
import { Icon } from "../icon";
import { OfferVisual } from "./offer-visual";

export function useDiscountLabel() {
  const locale = useLocale();
  const t = useTranslations("Offer");
  return (d: OfferCardData["discount"]) => formatDiscount(locale, d, { twoForOne: t("twoForOne") });
}

/** Listing row: round art, discount badge, venue, area and one-line conditions. */
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const discount = useDiscountLabel();
  return (
    <Link href={`/offers/${offer.slug}`} className="offer-card">
      <div className="art">
        <OfferVisual artKind={offer.artKind} imageUrl={offer.imageUrl} alt="" />
      </div>
      <span className="badge">{discount(offer.discount)}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-6 sm:pt-4">
        <h3 className="text-[clamp(20px,2vw,26px)] font-bold">{offer.venueName}</h3>
        <span className="meta">
          <Icon name="pin" />
          <span className="truncate">
            {offer.neighbourhood} · {offer.category.name}
          </span>
        </span>
        <p className="note-box">{offer.title}</p>
      </div>
    </Link>
  );
}

/** Tall card for grids (home "new in the club"). */
export function OfferTile({ offer }: { offer: OfferCardData }) {
  const discount = useDiscountLabel();
  return (
    <Link href={`/offers/${offer.slug}`} className="group flex flex-col overflow-hidden rounded-[30px] bg-white shadow-1 transition-transform hover:-translate-y-1.5 hover:shadow-2">
      <div className="art relative aspect-[4/3]">
        <OfferVisual artKind={offer.artKind} imageUrl={offer.imageUrl} alt="" />
        <span className="tag">{discount(offer.discount)}</span>
      </div>
      <div className="flex flex-col gap-1.5 px-5 pt-4 pb-5">
        <h3 className="text-[22px] font-bold">{offer.venueName}</h3>
        <span className="meta">
          <Icon name="pin" />
          <span className="truncate">{offer.neighbourhood}</span>
        </span>
        <p className="text-[15px] font-semibold text-ink">{offer.title}</p>
      </div>
    </Link>
  );
}
