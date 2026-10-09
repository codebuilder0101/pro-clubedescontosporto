"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getActiveSubscription } from "@/lib/auth/guards";
import { hashPassword, verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  currentSessionToken,
  deleteSessionCookie,
  invalidateSession,
  invalidateUserSessions,
  setSessionCookie,
} from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { FEATURES } from "@/lib/features";
import { generateMemberNumber } from "@/lib/member-number";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-meta";
import { safeNextPath } from "@/lib/safe-redirect";
import { siteUrl } from "@/lib/seo";
import {
  fieldErrors,
  forgotPasswordSchema,
  planSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import type { FormState } from "./form-state";

const MINUTE = 60_000;
const RESET_TTL_MS = 60 * MINUTE;

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : undefined);

/** `?plan=` carried through the join flow, if valid. */
function planQuery(raw: FormDataEntryValue | null): { plan?: string } {
  const plan = planSchema.safeParse(text(raw)?.toUpperCase());
  return plan.success ? { plan: plan.data.toLowerCase() } : {};
}

async function startSession(userId: string) {
  const { token, expiresAt } = await createSession(userId, (await headers()).get("user-agent"));
  await setSessionCookie(token, expiresAt);
}

// ---------- Sign up ----------

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = (await getLocale()) as Locale;
  const values = { name: text(formData.get("name")) ?? "", email: text(formData.get("email")) ?? "" };

  const limit = await rateLimit(`signup:ip:${await clientIp()}`, 10, 60 * MINUTE);
  if (!limit.ok) return { errors: { form: "rateLimited" }, values };

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { errors: { email: "emailTaken" }, values };
  }

  const passwordHash = await hashPassword(password);
  let userId: string | undefined;
  // Member numbers are random; retry on the (rare) collision.
  for (let attempt = 0; attempt < 5 && !userId; attempt++) {
    try {
      const user = await db.user.create({
        data: { name, email, passwordHash, memberNumber: generateMemberNumber(), preferredLocale: locale, termsAcceptedAt: new Date() },
        select: { id: true },
      });
      userId = user.id;
    } catch (err) {
      // Unique violation: either the email was taken meanwhile or the number collided.
      if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
        return { errors: { email: "emailTaken" }, values };
      }
      if (attempt === 4) throw err;
    }
  }

  await startSession(userId!);
  redirect({ href: { pathname: "/join", query: planQuery(formData.get("plan")) }, locale });
  return {};
}

// ---------- Sign in ----------

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = (await getLocale()) as Locale;
  const values = { email: text(formData.get("email")) ?? "" };

  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { email, password } = parsed.data;

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${await clientIp()}`, 30, 15 * MINUTE),
    rateLimit(`login:email:${email}`, 10, 15 * MINUTE),
  ]);
  if (!byIp.ok || !byEmail.ok) return { errors: { form: "rateLimited" }, values };

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, blockedAt: true, role: true } });
  if (!user) {
    await verifyDummyPassword(password);
    return { errors: { form: "invalidCredentials" }, values };
  }
  if (!(await verifyPassword(user.passwordHash, password))) {
    return { errors: { form: "invalidCredentials" }, values };
  }
  // Only revealed after a correct password, so it can't be used to probe accounts.
  if (user.blockedAt) return { errors: { form: "accountBlocked" }, values };

  await db.user.update({ where: { id: user.id }, data: { preferredLocale: locale } });
  await startSession(user.id);

  const next = safeNextPath(text(formData.get("next")));
  // The admin goes to the backoffice; members without a pass to the plan step.
  if (user.role === "ADMIN") {
    redirect({ href: next ?? "/admin", locale });
    return {};
  }
  const active = await getActiveSubscription(user.id);
  redirect({ href: active ? (next ?? "/home") : "/join", locale });
  return {};
}

// ---------- Sign out ----------

export async function signOut(): Promise<void> {
  const locale = await getLocale();
  const token = await currentSessionToken();
  if (token) await invalidateSession(token);
  await deleteSessionCookie();
  redirect({ href: "/", locale });
}

// ---------- Password reset ----------

/** Always reports success, so the form can't be used to discover accounts. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!FEATURES.passwordReset) return { errors: { form: "resetInvalid" } };
  const locale = (await getLocale()) as Locale;
  const values = { email: text(formData.get("email")) ?? "" };

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { email } = parsed.data;

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`reset:ip:${await clientIp()}`, 10, 60 * MINUTE),
    rateLimit(`reset:email:${email}`, 3, 60 * MINUTE),
  ]);
  if (!byIp.ok) return { errors: { form: "rateLimited" }, values };

  const user = byEmail.ok
    ? await db.user.findUnique({ where: { email }, select: { id: true, name: true, preferredLocale: true } })
    : null;
  if (user) {
    const token = generateToken();
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.create({
        data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      }),
    ]);
    await sendResetEmail(email, user.name, locale, token);
  }
  return { ok: true, values };
}

async function sendResetEmail(to: string, name: string, locale: Locale, token: string) {
  const t = await getTranslations({ locale, namespace: "Email.reset" });
  const url = new URL(getPathname({ locale, href: { pathname: "/reset-password", query: { token } } }), siteUrl()).toString();
  const { html, text: plain } = emailLayout({
    lang: locale,
    heading: t("heading", { name }),
    paragraphs: [t("body"), t("expiry")],
    cta: { label: t("cta"), url },
    footer: t("footer"),
  });
  await sendEmail({ to, subject: t("subject"), html, text: plain });
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!FEATURES.passwordReset) return { errors: { form: "resetInvalid" } };
  const locale = (await getLocale()) as Locale;

  const parsed = resetPasswordSchema.safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { token, password } = parsed.data;

  const record = await db.passwordResetToken.findUnique({ where: { id: hashToken(token) } });
  if (!record || record.expiresAt <= new Date()) {
    if (record) await db.passwordResetToken.delete({ where: { id: record.id } });
    return { errors: { form: "resetInvalid" } };
  }

  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  // A reset signs out every device, then signs this one in.
  await invalidateUserSessions(record.userId);
  await startSession(record.userId);

  const role = (await db.user.findUnique({ where: { id: record.userId }, select: { role: true } }))?.role;
  const active = role === "ADMIN" || (await getActiveSubscription(record.userId));
  redirect({ href: role === "ADMIN" ? "/admin" : active ? "/home" : "/join", locale });
  return {};
}
