import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Categories } from "@/components/landing/categories";
import { CtaBand } from "@/components/landing/cta-band";
import { Faq } from "@/components/landing/faq";
import { Featured } from "@/components/landing/featured";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Plans } from "@/components/landing/plans";
import { SavingsCalculator } from "@/components/landing/savings-calculator";
import { Wave, WAVE_A, WAVE_B } from "@/components/landing/section";
import { ZonesMap } from "@/components/landing/zones-map";
import { routing } from "@/i18n/routing";
import { getLandingStats } from "@/lib/landing-stats";
import { pageMetadata } from "@/lib/seo";

// Static page; the public counts are refreshed from the database hourly.
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata(locale, "/");
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const stats = await getLandingStats();

  return (
    <>
      <Hero partners={stats.partners} />
      <Wave d={WAVE_A} fill="#E6ECF7" />
      <Categories counts={stats.categories} total={stats.totalOffers} />
      <Wave d={WAVE_B} fill="#123274" background="#E6ECF7" />
      <HowItWorks />
      <Wave d={WAVE_B} fill="var(--linen)" background="#0F2D6B" flip />
      <Featured />
      <SavingsCalculator />
      <ZonesMap counts={stats.zones} />
      <Plans />
      <Faq />
      <CtaBand />
    </>
  );
}
