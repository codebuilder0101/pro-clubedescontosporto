"use server";

import { redirect as nextRedirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getActiveSubscription, requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/seo";
import { getPriceId, stripe, stripeConfigured, stripeLocale } from "@/lib/stripe";
import { planSchema } from "@/lib/validation/auth";
import type { FormState } from "./form-state";

/**
 * Sends the signed-in user to Stripe Checkout for the chosen plan. Nothing
 * is written to our subscriptions here: access starts when the verified
 * webhook arrives (CLAUDE.md rule 3).
 */
export async function startCheckout(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = (await getLocale()) as Locale;
  const user = await requireUser("/join");

  if (await getActiveSubscription(user.id)) {
    redirect({ href: "/home", locale });
  }

  const plan = planSchema.safeParse(formData.get("plan"));
  if (!plan.success) return { errors: { plan: "planRequired" } };

  if (!stripeConfigured()) return { errors: { form: "paymentsUnavailable" } };

  const limit = await rateLimit(`checkout:user:${user.id}`, 10, 60 * 60_000);
  if (!limit.ok) return { errors: { form: "rateLimited" } };

  let url: string | null;
  try {
    let customer = user.stripeCustomerId;
    if (!customer) {
      const created = await stripe().customers.create({
        email: user.email,
        name: user.name,
        preferred_locales: [stripeLocale(locale)],
        metadata: { userId: user.id },
      });
      customer = created.id;
      // Linking the customer isn't billing state; status still comes only from webhooks.
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } });
    }

    const absolute = (href: string) => new URL(getPathname({ locale, href }), siteUrl()).toString();
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: await getPriceId(plan.data), quantity: 1 }],
      // Card and SEPA Direct Debit are switched on in the Stripe Dashboard
      // (Settings → Payment methods); this API version has no per-session list.
      ...(process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION
        ? { payment_method_configuration: process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION }
        : {}),
      locale: stripeLocale(locale),
      subscription_data: { metadata: { userId: user.id } },
      metadata: { userId: user.id },
      success_url: `${absolute("/join/welcome")}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${absolute("/join")}?canceled=1`,
    });
    url = session.url;
  } catch (err) {
    console.error("[stripe] checkout session failed", err);
    return { errors: { form: "paymentsError" } };
  }

  if (!url) return { errors: { form: "paymentsError" } };
  nextRedirect(url);
}
