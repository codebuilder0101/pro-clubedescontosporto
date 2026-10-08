import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthHeading, AuthTabs } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { redirectIfSignedIn } from "@/lib/auth/guards";
import { safeNextPath } from "@/lib/safe-redirect";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Login" });
  return pageMetadata(locale, "/login", { title: t("metaTitle"), noindex: true });
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const next = safeNextPath((await searchParams).next) ?? undefined;
  await redirectIfSignedIn(next);
  const t = await getTranslations("Login");

  return (
    <>
      <AuthTabs active="login" />
      <AuthHeading title={t("title")} lead={t("lead")} />
      <SignInForm next={next} />
      <p className="mt-6 text-center text-[15px] font-semibold text-mute">
        {t("noAccount")}{" "}
        <Link href="/join" className="font-extrabold text-cobalt underline-offset-4 hover:underline">
          {t("join")}
        </Link>
      </p>
    </>
  );
}
