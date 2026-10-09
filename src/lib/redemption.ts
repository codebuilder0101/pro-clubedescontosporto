import type { DiscountLike } from "./discount";

/** A member can record the same offer once per this window. */
export const REDEMPTION_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Estimated saving for one use, from the bill before the discount (optional).
 * PERCENT needs the bill; AMOUNT is the fixed value (capped at the bill);
 * 2-for-1 is half the bill (two items, one free); OTHER can't be estimated.
 */
export function estimateSaving(discount: DiscountLike, bill: number | null): number | null {
  const value = discount.discountValue ?? 0;
  switch (discount.discountType) {
    case "PERCENT":
      return bill === null ? null : round2((bill * value) / 100);
    case "AMOUNT":
      return bill === null ? value : round2(Math.min(value, bill));
    case "TWO_FOR_ONE":
      return bill === null ? null : round2(bill / 2);
    case "OTHER":
      return null;
  }
}
