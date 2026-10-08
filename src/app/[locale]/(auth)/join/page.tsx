import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthHeading, AuthTabs } from "@/components/auth/auth-shell";
import { JoinSteps } from "@/components/auth/join-steps";
import { PlanForm } from "@/components/auth/plan-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { FormAlert } from "@/components/form/field";
import { Icon } from "@/components/icon";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { signOut } from "@/lib/actions/auth";
import { getActiveSubscription, getCurrentUser } from "@/lib/auth/guards";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/join">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Join" });
  return pageMetadata(locale, "/join", { title: t("metaTitle"), noindex: true });
}

/**
 * Join flow. Step 1 (no session): create the account. Step 2 (signed in,
 * no active pass): choose a plan and go to Stripe Checkout. Members with an
 * active pass go straight to their home.
 */
export default async function JoinPage({ params, searchParams }: PageProps<"/[locale]/join">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const planParam = typeof sp.plan === "string" ? sp.plan.toLowerCase() : undefined;
  const plan = planParam === "monthly" || planParam === "yearly" ? planParam : undefined;
  const t = await getTranslations("Join");

  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <AuthTabs active="join" />
        <div className="mb-6">
          <JoinSteps current={1} />
        </div>
        <AuthHeading title={t("title")} lead={t("lead")} />
        <SignUpForm plan={plan} />
        <SecureNote />
      </>
    );
  }

  if (await getActiveSubscription(user.id)) redirect({ href: "/home", locale });

  return (
    <>
      <div className="mb-6">
        <JoinSteps current={2} />
      </div>
      <AuthHeading eyebrow={t("planEyebrow")} title={t("planTitle")} lead={t("planLead", { name: user.name.split(" ")[0] })} />
      {sp.canceled === "1" && (
        <div className="mb-5">
          <FormAlert tone="info">{t("canceled")}</FormAlert>
        </div>
      )}
      <PlanForm initialPlan={plan === "yearly" ? "YEARLY" : "MONTHLY"} />
      <p className="mt-5 flex items-start gap-3 text-[15px] text-mute">
        <span className="ci [--s:36px]" aria-hidden="true">
          <Icon name="lock" />
        </span>
        {t("stripeNote")}
      </p>
      <form action={signOut} className="mt-5 text-center text-[15px] text-mute">
        {t("signedInAs", { email: user.email })}{" "}
        <button type="submit" className="font-extrabold text-cobalt underline-offset-4 hover:underline">
          {t("notYou")}
        </button>
      </form>
    </>
  );
}

async function SecureNote() {
  const t = await getTranslations("Auth");
  return (
    <p className="mt-6 flex items-start gap-3 text-[15px] text-mute">
      <span className="ci ci-leaf [--s:36px]" aria-hidden="true">
        <Icon name="shield" />
      </span>
      {t("secureNote")}
    </p>
  );
}
