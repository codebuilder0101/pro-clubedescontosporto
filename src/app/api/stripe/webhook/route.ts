import Stripe from "stripe";
import { applyStripeEvent } from "@/lib/stripe-webhook";

// Stripe → us. The signature check is the only thing that makes this
// request trustworthy, so nothing is read before it passes.

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    // Verifying needs no API key, only the signing secret.
    event = Stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const outcome = await applyStripeEvent(event);
    return Response.json({ received: true, outcome });
  } catch (err) {
    console.error(`[stripe] failed to apply ${event.type} ${event.id}`, err);
    // 500 makes Stripe retry later.
    return new Response("Webhook handler failed", { status: 500 });
  }
}
