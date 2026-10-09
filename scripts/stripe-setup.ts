/**
 * `npm run stripe:setup` — creates the club product and its two EUR prices in
 * the Stripe account of STRIPE_SECRET_KEY, if they don't exist yet. Prices
 * are found by lookup key (src/lib/stripe.ts), so no price IDs go in .env.
 * Safe to re-run. Use a test key (sk_test_…) first, then the live key.
 */
import { loadEnvConfig } from "@next/env";
import Stripe from "stripe";
import { MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR } from "../src/lib/pricing";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first.");
  process.exit(1);
}
const stripe = new Stripe(key);

const PRODUCT_TAG = "clubedescontosporto-pass";
const plans = [
  { lookupKey: "club_monthly_eur", amount: MONTHLY_PRICE_EUR, interval: "month" as const, nickname: "Monthly pass" },
  { lookupKey: "club_yearly_eur", amount: YEARLY_PRICE_EUR, interval: "year" as const, nickname: "Yearly pass" },
];

async function main() {
  console.log(`Stripe account mode: ${key!.startsWith("sk_live") ? "LIVE" : "test"}`);

  const existing = await stripe.products.search({ query: `metadata['app']:'${PRODUCT_TAG}'` });
  const product =
    existing.data[0] ??
    (await stripe.products.create({
      name: "Clube Descontos Porto — Passe",
      description: "Acesso a descontos, experiências e eventos no Grande Porto.",
      metadata: { app: PRODUCT_TAG },
    }));
  console.log(`Product: ${product.id}`);

  for (const plan of plans) {
    const found = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 });
    if (found.data[0]) {
      const p = found.data[0];
      const ok = p.unit_amount === Math.round(plan.amount * 100) && p.recurring?.interval === plan.interval && p.currency === "eur";
      console.log(`${plan.lookupKey}: exists (${p.id})${ok ? "" : "  ⚠ amount/interval differs from src/lib/pricing.ts"}`);
      continue;
    }
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: Math.round(plan.amount * 100),
      recurring: { interval: plan.interval },
      lookup_key: plan.lookupKey,
      nickname: plan.nickname,
    });
    console.log(`${plan.lookupKey}: created (${price.id})`);
  }

  // Customer Portal: switch plan, cancel at period end, update payment method, invoices.
  const priceIds = [];
  for (const plan of plans) {
    const { data } = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 });
    if (data[0]) priceIds.push(data[0].id);
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubedescontosporto.pt";
  const portalFeatures = {
    customer_update: { enabled: false },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end" as const, cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "other"] as ("too_expensive" | "unused" | "other")[] } },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price" as const],
      proration_behavior: "create_prorations" as const,
      products: [{ product: product.id, prices: priceIds }],
    },
  };
  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
  const existingPortal = configs.data.find((c) => c.metadata?.app === "clubedescontosporto-portal");
  const portalParams = {
    business_profile: { headline: "Clube Descontos Porto", privacy_policy_url: `${site}/pt/privacy`, terms_of_service_url: `${site}/pt/terms` },
    features: portalFeatures,
    default_return_url: `${site}/pt/account`,
  };
  if (existingPortal) {
    await stripe.billingPortal.configurations.update(existingPortal.id, portalParams);
    console.log(`Customer Portal: updated (${existingPortal.id})`);
  } else {
    const created = await stripe.billingPortal.configurations.create({ ...portalParams, metadata: { app: "clubedescontosporto-portal" } });
    console.log(`Customer Portal: created (${created.id})`);
  }

  console.log("\nNext: in the Stripe Dashboard enable Card and SEPA Direct Debit (Settings → Payment methods),");
  console.log("and add a webhook endpoint for https://clubedescontosporto.pt/api/stripe/webhook with the events:");
  console.log("  checkout.session.completed, customer.subscription.created, customer.subscription.updated,");
  console.log("  customer.subscription.deleted, customer.subscription.paused, customer.subscription.resumed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
