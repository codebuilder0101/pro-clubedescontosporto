"use server";

import { getLocale } from "next-intl/server";
import * as z from "zod";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-meta";
import { siteUrl } from "@/lib/seo";
import { emailSchema, fieldErrors } from "@/lib/validation/auth";
import type { FormState } from "./form-state";

const partnerSchema = z.object({
  businessName: z.string().trim().min(2, { error: "required" }).max(120, { error: "tooLong" }),
  contactName: z.string().trim().min(2, { error: "required" }).max(80, { error: "tooLong" }),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(30, { error: "phoneInvalid" })
    .regex(/^[+0-9 ()-]*$/, { error: "phoneInvalid" })
    .optional(),
  categorySlug: z.string().regex(/^[a-z0-9-]{0,40}$/).optional(),
  city: z.string().trim().min(2, { error: "required" }).max(80, { error: "tooLong" }),
  message: z.string().trim().min(10, { error: "messageShort" }).max(2000, { error: "tooLong" }),
  consent: z.literal("on", { error: "consentRequired" }),
});

const FIELDS = ["businessName", "contactName", "email", "phone", "categorySlug", "city", "message"] as const;

/** Public "become a partner" form. Stored for the backoffice; the team is notified by email. */
export async function submitPartnerRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));

  // Honeypot: real people never see or fill this field.
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const limit = await rateLimit(`partner:ip:${await clientIp()}`, 5, 60 * 60_000);
  if (!limit.ok) return { errors: { form: "rateLimited" }, values };

  const parsed = partnerSchema.safeParse({ ...values, consent: formData.get("consent") ?? undefined });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { consent: _consent, ...data } = parsed.data;
  void _consent;

  const category = data.categorySlug ? await db.category.findUnique({ where: { slug: data.categorySlug }, select: { slug: true } }) : null;
  const locale = (await getLocale()) as Locale;
  const request = await db.partnerRequest.create({
    data: { ...data, phone: data.phone || null, categorySlug: category?.slug ?? null, locale },
    select: { id: true },
  });

  const notify = process.env.PARTNER_NOTIFY_EMAIL;
  if (notify) {
    const { html, text } = emailLayout({
      lang: "pt-PT",
      heading: `Novo pedido de parceria: ${data.businessName}`,
      paragraphs: [`${data.contactName} · ${data.email}${data.phone ? ` · ${data.phone}` : ""}`, `${data.city}`, data.message],
      cta: { label: "Abrir no backoffice", url: new URL(`/pt/admin/partner-requests#${request.id}`, siteUrl()).toString() },
      footer: "Clube Descontos Porto",
    });
    await sendEmail({ to: notify, subject: `Pedido de parceria: ${data.businessName}`, html, text }).catch((err) => console.error(err));
  }
  return { ok: true };
}
