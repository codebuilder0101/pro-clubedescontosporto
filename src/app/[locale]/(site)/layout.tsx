import { setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/site-shell";

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Every layout using next-intl must set the locale to stay statically rendered.
  const { locale } = await params;
  setRequestLocale(locale);
  return <SiteShell>{children}</SiteShell>;
}
