import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// GDPR data export: everything we store about the signed-in member, as JSON.

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      name: true,
      preferredLocale: true,
      memberNumber: true,
      termsAcceptedAt: true,
      createdAt: true,
      subscriptions: {
        select: { provider: true, plan: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, createdAt: true },
      },
      favorites: { select: { createdAt: true, offer: { select: { slug: true, venue: { select: { name: true } } } } } },
      redemptions: {
        select: { createdAt: true, billAmount: true, savedAmount: true, offer: { select: { slug: true, venue: { select: { name: true } } } } },
      },
      sessions: { select: { createdAt: true, lastUsedAt: true, userAgent: true, expiresAt: true } },
    },
  });
  if (!user) return new Response("Not found", { status: 404 });

  const body = JSON.stringify({ exportedAt: new Date().toISOString(), account: user }, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="clubedescontosporto-${user.memberNumber}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
