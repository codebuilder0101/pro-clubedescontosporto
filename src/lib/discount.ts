import { formatMoney, intlLocale } from "./format";

export type DiscountLike = {
  discountType: "PERCENT" | "AMOUNT" | "TWO_FOR_ONE" | "OTHER";
  discountValue: number | null;
  /** Translated badge, used for OTHER. */
  badge?: string | null;
};

/**
 * Short badge text for an offer: "-30%" (es "-30 %"), "-10 €" / "-€10",
 * or the localised 2-for-1 label. Intl keeps the no-break space where the
 * locale uses one, so the badge never wraps inside a unit.
 */
export function formatDiscount(locale: string, d: DiscountLike, labels: { twoForOne: string }): string {
  switch (d.discountType) {
    case "PERCENT":
      return new Intl.NumberFormat(intlLocale(locale), {
        style: "percent",
        maximumFractionDigits: 0,
      }).format(-(d.discountValue ?? 0) / 100);
    case "AMOUNT":
      return formatMoney(locale, -(d.discountValue ?? 0));
    case "TWO_FOR_ONE":
      return labels.twoForOne;
    case "OTHER":
      return d.badge ?? "";
  }
}
