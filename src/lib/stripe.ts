import "server-only";
import Stripe from "stripe";
import type { Plan } from "@/generated/prisma/enums";
import type { Locale } from "@/i18n/routing";

// Stripe is the source of truth for billing (CLAUDE.md rule 3). This module
// creates Checkout Sessions; subscription state only changes in the webhook.

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | undefined;
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key, { appInfo: { name: "Clube Descontos Porto" } });
  return client;
}

/** Prices are found by lookup key (created by `npm run stripe:setup`), so no price IDs in env. */
export const PRICE_LOOKUP_KEYS: Record<Plan, string> = {
  MONTHLY: "club_monthly_eur",
  YEARLY: "club_yearly_eur",
};

const priceCache = new Map<Plan, { id: string; at: number }>();
export async function getPriceId(plan: Plan): Promise<string> {
  const cached = priceCache.get(plan);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.id;
  const { data } = await stripe().prices.list({ lookup_keys: [PRICE_LOOKUP_KEYS[plan]], active: true, limit: 1 });
  if (!data[0]) throw new Error(`No active Stripe price with lookup key ${PRICE_LOOKUP_KEYS[plan]}`);
  priceCache.set(plan, { id: data[0].id, at: Date.now() });
  return data[0].id;
}

/** Stripe Checkout / customer locale for an app locale. */
export function stripeLocale(locale: Locale): Stripe.Checkout.SessionCreateParams.Locale {
  return ({ "pt-PT": "pt", fr: "fr", es: "es", en: "en-GB" } as const)[locale];
}

/** Tag on the Customer Portal configuration created by `npm run stripe:setup`. */
export const PORTAL_CONFIG_TAG = "clubedescontosporto-portal";

let portalConfig: { id: string | null; at: number } | undefined;
/** The club's portal configuration (plan switch, cancel at period end, payment method, invoices). */
export async function getPortalConfigurationId(): Promise<string | null> {
  if (portalConfig && Date.now() - portalConfig.at < 10 * 60_000) return portalConfig.id;
  const { data } = await stripe().billingPortal.configurations.list({ active: true, limit: 100 });
  const found = data.find((c) => c.metadata?.app === PORTAL_CONFIG_TAG);
  portalConfig = { id: found?.id ?? null, at: Date.now() };
  return portalConfig.id;
}

/** Stripe statuses where the member must fix their payment instead of starting a new subscription. */
export const PAYMENT_ISSUE_STATUSES = ["PAST_DUE", "UNPAID", "PAUSED"] as const;
