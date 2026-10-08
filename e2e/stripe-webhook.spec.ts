import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { E2E_WEBHOOK_SECRET } from "./constants";
import { cookieHeader, createSession, createUser, db, uniqueEmail } from "./helpers";

// Subscription status changes only through verified Stripe webhooks (CLAUDE.md rule 3).

const now = () => Math.floor(Date.now() / 1000);

function subscriptionEvent(opts: { id: string; type: string; created: number; subId: string; userId: string; status: string; periodEnd: number }) {
  return {
    id: opts.id,
    object: "event",
    type: opts.type,
    created: opts.created,
    data: {
      object: {
        id: opts.subId,
        object: "subscription",
        status: opts.status,
        customer: `cus_${opts.userId}`,
        metadata: { userId: opts.userId },
        cancel_at_period_end: false,
        created: opts.created,
        ended_at: null,
        items: { data: [{ current_period_end: opts.periodEnd, price: { id: "price_e2e", recurring: { interval: "month" } } }] },
      },
    },
  };
}

async function send(request: import("@playwright/test").APIRequestContext, event: object, secret = E2E_WEBHOOK_SECRET) {
  const payload = JSON.stringify(event);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return request.post("/api/stripe/webhook", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
}

test("unsigned or wrongly signed events are rejected", async ({ request }) => {
  const unsigned = await request.post("/api/stripe/webhook", { data: "{}" });
  expect(unsigned.status()).toBe(400);
  const forged = await send(request, { id: "evt_forged", type: "customer.subscription.created" }, "whsec_wrong");
  expect(forged.status()).toBe(400);
});

test("a verified subscription event grants access; duplicates and stale events change nothing", async ({ request }) => {
  const email = uniqueEmail("webhook");
  const userId = await createUser(email);
  const token = await createSession(email);
  const subId = `sub_${userId}`;
  const t0 = now();

  // Before: no access.
  let res = await request.get("/pt/home", { headers: cookieHeader(token), maxRedirects: 0 });
  expect(res.headers().location).toMatch(/\/pt\/join$/);

  const created = subscriptionEvent({ id: `evt_a_${userId}`, type: "customer.subscription.created", created: t0, subId, userId, status: "active", periodEnd: t0 + 30 * 86400 });
  res = await send(request, created);
  expect(await res.json()).toMatchObject({ received: true, outcome: "applied" });

  res = await request.get("/pt/home", { headers: cookieHeader(token), maxRedirects: 0 });
  expect(res.status()).toBe(200);

  // Same event again: recorded once.
  res = await send(request, created);
  expect(await res.json()).toMatchObject({ outcome: "duplicate" });

  // A cancellation arrives…
  res = await send(request, subscriptionEvent({ id: `evt_c_${userId}`, type: "customer.subscription.deleted", created: t0 + 10, subId, userId, status: "canceled", periodEnd: t0 + 30 * 86400 }));
  expect(await res.json()).toMatchObject({ outcome: "applied" });
  // …then an older "active" update shows up late and must not resurrect it.
  res = await send(request, subscriptionEvent({ id: `evt_b_${userId}`, type: "customer.subscription.updated", created: t0 + 5, subId, userId, status: "active", periodEnd: t0 + 30 * 86400 }));
  expect(await res.json()).toMatchObject({ outcome: "stale" });

  const { rows } = await db().query(`SELECT status, provider FROM "Subscription" WHERE "stripeSubscriptionId" = $1`, [subId]);
  expect(rows).toEqual([{ status: "CANCELED", provider: "STRIPE" }]);
  res = await request.get("/pt/home", { headers: cookieHeader(token), maxRedirects: 0 });
  expect(res.headers().location).toMatch(/\/pt\/join$/);
});

test("events for unknown users are acknowledged but ignored", async ({ request }) => {
  const t0 = now();
  const res = await send(request, subscriptionEvent({ id: `evt_unknown_${t0}`, type: "customer.subscription.created", created: t0, subId: `sub_unknown_${t0}`, userId: "nobody", status: "active", periodEnd: t0 + 86400 }));
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ outcome: "ignored" });
});
