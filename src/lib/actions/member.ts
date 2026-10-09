"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireActiveMember } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { REDEMPTION_COOLDOWN_MS, estimateSaving } from "@/lib/redemption";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

/** Adds or removes an offer from the member's favourites. Returns the new state. */
export async function toggleFavorite(slug: string): Promise<{ ok: boolean; favorite: boolean }> {
  const { user } = await requireActiveMember();
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return { ok: false, favorite: false };

  const offer = await db.offer.findFirst({ where: { slug: parsed.data, status: "PUBLISHED" }, select: { id: true } });
  if (!offer) return { ok: false, favorite: false };

  const key = { userId_offerId: { userId: user.id, offerId: offer.id } };
  const existing = await db.favorite.findUnique({ where: key, select: { offerId: true } });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.upsert({ where: key, create: { userId: user.id, offerId: offer.id }, update: {} });

  revalidatePath("/[locale]/(member)/favorites", "page");
  return { ok: true, favorite: !existing };
}

export type RedemptionState = { status?: "ok" | "cooldown" | "invalid"; saved?: number | null };

const redemptionSchema = z.object({
  slug: slugSchema,
  // Optional bill before the discount: "", "42", "42,50" or "42.50".
  bill: z
    .string()
    .trim()
    .regex(/^(\d{1,5}([.,]\d{1,2})?)?$/)
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .optional(),
});

/** Records that the member used a discount (self-reported) and estimates the saving. */
export async function recordRedemption(_prev: RedemptionState, formData: FormData): Promise<RedemptionState> {
  const { user } = await requireActiveMember();
  const parsed = redemptionSchema.safeParse({ slug: formData.get("slug"), bill: formData.get("bill") ?? undefined });
  if (!parsed.success) return { status: "invalid" };

  const offer = await db.offer.findFirst({
    where: { slug: parsed.data.slug, status: "PUBLISHED" },
    select: { id: true, discountType: true, discountValue: true },
  });
  if (!offer) return { status: "invalid" };

  const recent = await db.redemption.findFirst({
    where: { userId: user.id, offerId: offer.id, createdAt: { gt: new Date(Date.now() - REDEMPTION_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return { status: "cooldown" };

  const bill = parsed.data.bill ?? null;
  const saved = estimateSaving(
    { discountType: offer.discountType, discountValue: offer.discountValue?.toNumber() ?? null },
    bill,
  );
  await db.redemption.create({ data: { userId: user.id, offerId: offer.id, billAmount: bill, savedAmount: saved } });
  revalidatePath("/[locale]/(member)", "layout");
  return { status: "ok", saved };
}
