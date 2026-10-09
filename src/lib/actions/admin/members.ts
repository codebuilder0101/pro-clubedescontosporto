"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { FormState } from "../form-state";
import { failed, text } from "./shared";

const grantSchema = z.object({
  userId: z.string().min(1),
  days: z.coerce.number({ error: "numberInvalid" }).int({ error: "numberInvalid" }).min(1, { error: "numberInvalid" }).max(3660, { error: "numberInvalid" }),
  note: z.string().trim().max(200, { error: "tooLong" }),
});

/** Complimentary access (manual grant). Paid subscriptions are never edited here. */
export async function grantAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = grantSchema.safeParse({ userId: text(formData.get("userId")), days: text(formData.get("days")), note: text(formData.get("note")) });
  if (!parsed.success) return failed(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
  const { userId, days, note } = parsed.data;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return failed({ form: "notFound" });

  await db.subscription.create({
    data: {
      userId,
      provider: "MANUAL",
      plan: days >= 365 ? "YEARLY" : "MONTHLY",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + days * 86_400_000),
      note: note || null,
    },
  });
  await audit(admin.id, "member.grant", userId, `${user.email} · ${days} days${note ? ` · ${note}` : ""}`);
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true };
}

export async function revokeManualAccess(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = text(formData.get("userId"));
  const { count } = await db.subscription.updateMany({
    where: { userId, provider: "MANUAL", status: "ACTIVE" },
    data: { status: "CANCELED", currentPeriodEnd: new Date() },
  });
  if (count) await audit(admin.id, "member.revoke", userId, `${count} manual grant(s)`);
  revalidatePath("/[locale]/admin", "layout");
}

/** Blocking signs the member out everywhere and stops future sign-ins. */
export async function setBlocked(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = text(formData.get("userId"));
  const block = text(formData.get("block")) === "1";
  if (userId === admin.id) return; // an admin can't lock themselves out
  const user = await db.user.update({ where: { id: userId }, data: { blockedAt: block ? new Date() : null }, select: { email: true } });
  if (block) await db.session.deleteMany({ where: { userId } });
  await audit(admin.id, block ? "member.block" : "member.unblock", userId, user.email);
  revalidatePath("/[locale]/admin", "layout");
}
