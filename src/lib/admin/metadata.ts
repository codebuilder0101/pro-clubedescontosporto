import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

/** Backoffice pages are never indexed. */
export async function adminMetadata(locale: string, href: string, titleKey: string): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Admin.nav" });
  return pageMetadata(locale, href, { title: `${t(titleKey)} · ${t("badge")}`, noindex: true });
}
