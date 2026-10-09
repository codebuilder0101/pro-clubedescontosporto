"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { FormState } from "../form-state";
import { failed, text } from "./shared";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "ACCEPTED", "REJECTED"]),
  notes: z.string().max(2000, { error: "tooLong" }),
});

export async function updatePartnerRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({ id: text(formData.get("id")), status: text(formData.get("status")), notes: text(formData.get("notes")) });
  if (!parsed.success) return failed({ notes: "tooLong" });
  const { id, status, notes } = parsed.data;
  const req = await db.partnerRequest.update({ where: { id }, data: { status, notes: notes || null }, select: { businessName: true } });
  await audit(admin.id, "partnerRequest.update", id, `${req.businessName} · ${status}`);
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true };
}
