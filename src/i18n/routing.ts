import { defineRouting } from "next-intl/routing";

export const locales = ["pt-PT", "fr", "es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-PT";

/** Short label shown in the locale switcher. */
export const localeLabels: Record<Locale, string> = {
  "pt-PT": "PT",
  fr: "FR",
  es: "ES",
  en: "EN",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // URL prefixes: pt-PT lives at /pt (not /pt-PT); the others match their tag.
  localePrefix: {
    mode: "always",
    prefixes: {
      "pt-PT": "/pt",
      fr: "/fr",
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
