/**
 * Display prices in euros. Billing amounts live in Stripe; these values are
 * only used for marketing copy and must match the Stripe prices.
 */
export const MONTHLY_PRICE_EUR = 1;
export const YEARLY_PRICE_EUR = 10;

/** What a year on the monthly plan costs. */
export const MONTHLY_PLAN_YEAR_COST_EUR = MONTHLY_PRICE_EUR * 12;

/** Whole months saved by paying yearly instead of monthly (2 at 1€/10€). */
export function yearlyPlanMonthsSaved(
  monthly: number = MONTHLY_PRICE_EUR,
  yearly: number = YEARLY_PRICE_EUR,
): number {
  return Math.max(0, Math.floor(12 - yearly / monthly));
}
