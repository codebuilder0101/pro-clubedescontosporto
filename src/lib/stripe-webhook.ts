import "server-only";
import type Stripe from "stripe";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { customerId, subscriptionFields } from "@/lib/stripe-subscription";

type Tx = Prisma.TransactionClient;

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export type WebhookOutcome = "applied" | "duplicate" | "ignored" | "stale";

/**
 * Applies one verified Stripe event. Runs in a transaction together with the
 * StripeEvent insert, so an event is either fully applied and recorded, or
 * rolled back and retried by Stripe.
 */
export async function applyStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  try {
    return await db.$transaction(async (tx) => {
      await tx.stripeEvent.create({ data: { id: event.id, type: event.type } });

      if (event.type === "checkout.session.completed") {
        await linkCheckoutCustomer(tx, event.data.object as Stripe.Checkout.Session);
        return "applied";
      }
      if (SUBSCRIPTION_EVENTS.has(event.type)) {
        return upsertSubscription(tx, event.data.object as Stripe.Subscription, new Date(event.created * 1000));
      }
      return "ignored";
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return "duplicate";
    throw err;
  }
}

/** Remember the Stripe customer of the user who checked out. */
async function linkCheckoutCustomer(tx: Tx, session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const customer = customerId(session.customer);
  if (!userId || !customer) return;
  await tx.user.updateMany({ where: { id: userId, stripeCustomerId: null }, data: { stripeCustomerId: customer } });
}

async function findUserId(tx: Tx, sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.userId;
  if (fromMetadata) {
    const user = await tx.user.findUnique({ where: { id: fromMetadata }, select: { id: true } });
    if (user) return user.id;
  }
  const customer = customerId(sub.customer);
  if (!customer) return null;
  const user = await tx.user.findUnique({ where: { stripeCustomerId: customer }, select: { id: true } });
  return user?.id ?? null;
}

async function upsertSubscription(tx: Tx, sub: Stripe.Subscription, eventAt: Date): Promise<WebhookOutcome> {
  const userId = await findUserId(tx, sub);
  if (!userId) {
    console.warn(`[stripe] subscription ${sub.id} has no matching user; ignored`);
    return "ignored";
  }

  const existing = await tx.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true, lastStripeEventAt: true },
  });
  // Stripe doesn't guarantee delivery order: never let an older event overwrite a newer one.
  if (existing?.lastStripeEventAt && existing.lastStripeEventAt > eventAt) return "stale";

  const fields = { ...subscriptionFields(sub), lastStripeEventAt: eventAt };
  if (existing) {
    await tx.subscription.update({ where: { id: existing.id }, data: fields });
  } else {
    await tx.subscription.create({
      data: { ...fields, userId, provider: "STRIPE", stripeSubscriptionId: sub.id },
    });
  }

  const customer = customerId(sub.customer);
  if (customer) {
    await tx.user.updateMany({ where: { id: userId, stripeCustomerId: null }, data: { stripeCustomerId: customer } });
  }
  return "applied";
}
