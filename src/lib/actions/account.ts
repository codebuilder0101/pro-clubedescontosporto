"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import * as z from "zod";
import { redirect } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { currentSessionId, deleteSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/seo";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { emailSchema, fieldErrors, newPasswordSchema } from "@/lib/validation/auth";
import type { FormState } from "./form-state";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

/** Checks the current password before a sensitive change. */
async function confirmPassword(userId: string, password: string): Promise<boolean> {
  const limit = await rateLimit(`account:pw:${userId}`, 10, 15 * 60_000);
  if (!limit.ok) return false;
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return Boolean(user && (await verifyPassword(user.passwordHash, password)));
}

// ---------- Profile ----------

const profileSchema = z.object({
  name: z.string().trim().min(2, { error: "nameRequired" }).max(80, { error: "nameTooLong" }),
  preferredLocale: z.enum(locales, { error: "localeInvalid" }),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const parsed = profileSchema.safeParse({ name: formData.get("name"), preferredLocale: formData.get("preferredLocale") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { name: text(formData.get("name")) } };

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  // Show the account page in the language the member just picked.
  redirect({ href: { pathname: "/account", query: { saved: "profile" } }, locale: parsed.data.preferredLocale });
  return {};
}

// ---------- Email ----------

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const values = { email: text(formData.get("email")) };
  const parsed = z.object({ email: emailSchema, password: z.string().min(1, { error: "passwordRequired" }) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { email, password } = parsed.data;

  if (email === user.email) return { errors: { email: "emailSame" }, values };
  if (!(await confirmPassword(user.id, password))) return { errors: { password: "passwordWrong" }, values };
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) return { errors: { email: "emailTaken" }, values };

  await db.user.update({ where: { id: user.id }, data: { email } });
  if (user.stripeCustomerId && stripeConfigured()) {
    // Receipts follow the new address. Not billing state, so a failure only gets logged.
    await stripe()
      .customers.update(user.stripeCustomerId, { email })
      .catch((err) => console.error("[stripe] customer email update failed", err));
  }
  await notifyEmailChanged(user.email, user.name, (await getLocale()) as Locale, email);
  revalidatePath("/[locale]/(member)/account", "page");
  return { ok: true, values: { email } };
}

async function notifyEmailChanged(oldEmail: string, name: string, locale: Locale, newEmail: string) {
  const t = await getTranslations({ locale, namespace: "Email.emailChanged" });
  const { html, text: plain } = emailLayout({
    lang: locale,
    heading: t("heading", { name }),
    paragraphs: [t("body", { email: newEmail }), t("notYou")],
    cta: { label: t("cta"), url: new URL("/", siteUrl()).toString() },
    footer: t("footer"),
  });
  await sendEmail({ to: oldEmail, subject: t("subject"), html, text: plain }).catch((err) => console.error(err));
}

// ---------- Password ----------

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const parsed = z
    .object({ current: z.string().min(1, { error: "passwordRequired" }), password: newPasswordSchema })
    .safeParse({ current: formData.get("current"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (!(await confirmPassword(user.id, parsed.data.current))) return { errors: { current: "passwordWrong" } };

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  // Every other device must sign in again with the new password.
  const thisSession = await currentSessionId();
  await db.session.deleteMany({ where: { userId: user.id, ...(thisSession ? { id: { not: thisSession } } : {}) } });
  revalidatePath("/[locale]/(member)/account", "page");
  return { ok: true };
}

// ---------- Devices ----------

export async function revokeSession(formData: FormData): Promise<void> {
  const user = await requireUser("/account");
  const id = text(formData.get("sessionId"));
  if (/^[0-9a-f]{64}$/.test(id)) await db.session.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/[locale]/(member)/account", "page");
}

export async function revokeOtherSessions(): Promise<void> {
  const user = await requireUser("/account");
  const thisSession = await currentSessionId();
  await db.session.deleteMany({ where: { userId: user.id, ...(thisSession ? { id: { not: thisSession } } : {}) } });
  revalidatePath("/[locale]/(member)/account", "page");
}

// ---------- Delete account (GDPR) ----------

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const locale = await getLocale();
  if (formData.get("confirm") !== "on") return { errors: { confirm: "confirmRequired" } };
  if (!(await confirmPassword(user.id, text(formData.get("password"))))) return { errors: { password: "passwordWrong" } };

  // Stop billing first: a deleted account must never be charged again.
  const live = await db.subscription.findMany({
    where: { userId: user.id, provider: "STRIPE", status: { notIn: ["CANCELED", "INCOMPLETE_EXPIRED"] } },
    select: { stripeSubscriptionId: true },
  });
  if (live.length) {
    if (!stripeConfigured()) return { errors: { form: "deleteBilling" } };
    try {
      for (const s of live) if (s.stripeSubscriptionId) await stripe().subscriptions.cancel(s.stripeSubscriptionId);
    } catch (err) {
      console.error("[stripe] cancel on account deletion failed", err);
      return { errors: { form: "deleteBilling" } };
    }
  }

  // Cascades to sessions, subscriptions, favourites, discount uses and tokens.
  await db.user.delete({ where: { id: user.id } });
  await deleteSessionCookie();
  redirect({ href: "/", locale });
  return {};
}
