import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthHeading } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { FEATURES } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Forgot" });
  return pageMetadata(locale, "/forgot-password", { title: t("metaTitle"), noindex: true });
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  if (!FEATURES.passwordReset) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Forgot");

  return (
    <>
      <AuthHeading title={t("title")} lead={t("lead")} />
      <ForgotForm />
      <Link href="/login" className="mt-6 inline-flex items-center gap-2 font-extrabold text-cobalt">
        <Icon name="back" className="size-5" strokeWidth={2.4} />
        {t("back")}
      </Link>
    </>
  );
}
