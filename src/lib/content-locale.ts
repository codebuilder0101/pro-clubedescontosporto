import { defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Picks the translation row for `locale`, falling back to pt-PT, then to
 * whatever exists. Database content may be incomplete while the club team
 * is still translating; the UI never shows an empty field because of it.
 */
export function pickTranslation<T extends { locale: string }>(rows: readonly T[], locale: Locale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === defaultLocale) ?? rows[0];
}
