"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";

/**
 * Segmented PT / BR / ES / EN control. Plain links, so it works without JS;
 * the proxy stores the choice in the NEXT_LOCALE cookie on navigation.
 */
export function LocaleSwitcher({
  className = "",
  tone = "light",
}: {
  className?: string;
  /** "dark" for use on --deep surfaces (footer). */
  tone?: "light" | "dark";
}) {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const index = locales.indexOf(current);

  const shell =
    tone === "dark"
      ? "border-white/20 bg-white/10"
      : "border-line bg-white shadow-[inset_0_1px_3px_rgba(15,45,107,.12),0_1px_0_#fff]";
  const idle = tone === "dark" ? "text-white/75 hover:text-white" : "text-mute hover:text-deep";

  return (
    <nav
      aria-label={t("label")}
      className={`relative grid h-[54px] w-[212px] flex-none grid-cols-4 rounded-full border p-[5px] ${shell} ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-[5px] left-[5px] h-[calc(100%-10px)] w-[calc((100%-10px)/4)] rounded-full bg-linear-to-b from-[#FFD45C] to-sun shadow-[0_4px_10px_-3px_rgba(232,169,0,.8)] transition-transform duration-[450ms] ease-[cubic-bezier(.5,1.6,.4,1)]"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            lang={locale}
            aria-label={t(locale)}
            aria-current={active ? "true" : undefined}
            title={t(locale)}
            className={`relative z-10 flex items-center justify-center rounded-full text-[15px] font-extrabold transition-colors ${
              active ? "text-ink" : idle
            }`}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
