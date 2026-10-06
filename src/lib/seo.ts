import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";

export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

/**
 * Canonical URL plus hreflang alternates for every locale and x-default
 * (which points at the default locale).
 */
export function localeAlternates(
  locale: Locale,
  href: string,
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = getPathname({ locale: l, href });
  }
  languages["x-default"] = getPathname({ locale: defaultLocale, href });

  return {
    canonical: getPathname({ locale, href }),
    languages,
  };
}

/** Per-page metadata: canonical + hreflang for `href`, optional title and noindex. */
export function pageMetadata(
  locale: Locale,
  href: string,
  { title, noindex = false }: { title?: string; noindex?: boolean } = {},
): Metadata {
  return {
    ...(title ? { title } : {}),
    alternates: localeAlternates(locale, href),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
