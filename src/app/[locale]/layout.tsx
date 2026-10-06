import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PRICE_EUR } from "@/lib/pricing";
import { siteUrl } from "@/lib/seo";
import "../globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-bricolage",
});
const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jetbrains",
});

export const viewport: Viewport = {
  themeColor: "#1747A6",
  colorScheme: "light",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Canonical/hreflang are set per page (see pageMetadata) so child pages never
// inherit the home page's canonical URL.
export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { metadataBase: siteUrl() };
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const description = t("description", {
    price: formatMoney(locale, MONTHLY_PRICE_EUR),
  });

  return {
    metadataBase: siteUrl(),
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description,
    openGraph: {
      title: t("title"),
      description,
      type: "website",
      siteName: t("title"),
      locale: locale.replace("-", "_"),
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t("title") }],
    },
    twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Common" });

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-full bg-deep px-5 py-3 font-bold text-white transition-transform focus:translate-y-0"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
