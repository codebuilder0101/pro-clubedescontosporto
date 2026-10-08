import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthHeading } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { hashToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { FEATURES } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Reset" });
  return pageMetadata(locale, "/reset-password", { title: t("metaTitle"), noindex: true });
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps<"/[locale]/reset-password">) {
  if (!FEATURES.passwordReset) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Reset");
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;

  // Read-only check so an expired link says so before the member types a password.
  const record = token ? await db.passwordResetToken.findUnique({ where: { id: hashToken(token) }, select: { expiresAt: true } }) : null;
  if (!token || !record || record.expiresAt <= new Date()) {
    return (
      <>
        <AuthHeading title={t("invalidTitle")} lead={t("invalidText")} />
        <Link href="/forgot-password" className="btn btn-sun w-full">
          {t("requestNew")}
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title={t("title")} lead={t("lead")} />
      <ResetForm token={token} />
    </>
  );
}
