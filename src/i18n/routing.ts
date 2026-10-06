import { defineRouting } from "next-intl/routing";

export const locales = ["pt-PT", "pt-BR", "es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-PT";

/** Short label shown in the locale switcher. */
export const localeLabels: Record<Locale, string> = {
  "pt-PT": "PT",
  "pt-BR": "BR",
  es: "ES",
  en: "EN",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // URL prefixes differ from the BCP 47 tags: pt-PT lives at /pt, pt-BR at /br.
  localePrefix: {
    mode: "always",
    prefixes: {
      "pt-PT": "/pt",
      "pt-BR": "/br",
      es: "/es",
      en: "/en",
    },
  },
  // Detection order on an unprefixed URL: NEXT_LOCALE cookie, Accept-Language, default.
  localeDetection: true,
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365 },
  // We emit hreflang ourselves through generateMetadata (including x-default).
  alternateLinks: false,
});
