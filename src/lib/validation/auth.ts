import * as z from "zod";

// Error messages are codes; the forms translate them (Auth.errors.*), so the
// same schema serves all four locales.

export const emailSchema = z
  .string({ error: "emailInvalid" })
  .trim()
  .toLowerCase()
  .max(254, { error: "emailInvalid" })
  .pipe(z.email({ error: "emailInvalid" }));

/** Length over composition rules (NIST SP 800-63B); argon2 has no length trap. */
export const newPasswordSchema = z
  .string({ error: "passwordTooShort" })
  .min(8, { error: "passwordTooShort" })
  .max(128, { error: "passwordTooLong" });

export const signUpSchema = z.object({
  name: z.string({ error: "nameRequired" }).trim().min(2, { error: "nameRequired" }).max(80, { error: "nameTooLong" }),
  email: emailSchema,
  password: newPasswordSchema,
  terms: z.literal("on", { error: "termsRequired" }),
});

export const signInSchema = z.object({
  email: emailSchema,
  // Any non-empty password is checked against the hash; no hints about rules here.
  password: z.string({ error: "passwordRequired" }).min(1, { error: "passwordRequired" }).max(128, { error: "invalidCredentials" }),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, { error: "resetInvalid" }),
  password: newPasswordSchema,
});

export const planSchema = z.enum(["MONTHLY", "YEARLY"]);

/** Field errors as { field: code } (first issue per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
