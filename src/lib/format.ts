export const TIME_ZONE = "Europe/Lisbon";
export const CURRENCY = "EUR";

/**
 * Intl locale for an app locale. Our "en" is British-neutral English, but
 * Intl treats bare "en" as en-US (e.g. "Dec 31"), so format it as en-GB.
 */
export function intlLocale(locale: string): string {
  return locale === "en" ? "en-GB" : locale;
}

/**
 * Formats a euro amount for the given locale. Whole amounts drop the
 * decimals ("1 €", "€1"); anything else keeps two ("10,50 €").
 */
export function formatMoney(locale: string, amount: number): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

/** Formats a date (and optionally time) in the club's time zone. */
export function formatDateTime(
  locale: string,
  date: Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    ...options,
    timeZone: TIME_ZONE,
  }).format(date);
}
