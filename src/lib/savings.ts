import { MONTHLY_PLAN_YEAR_COST_EUR } from "./pricing";

/** Average discount per category used by the landing-page estimate. */
export const SAVINGS_RATES = {
  restaurants: 0.22,
  bars: 0.3,
  culture: 0.18,
} as const;

export type SavingsCategory = keyof typeof SAVINGS_RATES;

export const OUTINGS_RANGE = { min: 1, max: 20, step: 1, initial: 4 } as const;
export const SPEND_RANGE = { min: 5, max: 120, step: 5, initial: 25 } as const;

export type SavingsEstimate = {
  /** Whole euros saved per month. */
  monthly: number;
  /** Whole euros saved per year. */
  yearly: number;
  /** How many times the yearly pass cost the savings cover (at least 1). */
  multiple: number;
};

export function estimateSavings(
  outingsPerMonth: number,
  spendPerOuting: number,
  category: SavingsCategory,
): SavingsEstimate {
  const monthly = Math.round(outingsPerMonth * spendPerOuting * SAVINGS_RATES[category]);
  const yearly = monthly * 12;
  const multiple = Math.max(1, Math.round(yearly / MONTHLY_PLAN_YEAR_COST_EUR));
  return { monthly, yearly, multiple };
}
