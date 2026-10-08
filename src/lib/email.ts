import "server-only";
import { Resend } from "resend";

export type Email = { to: string; subject: string; text: string; html: string };

let resend: Resend | undefined;

/**
 * Sends a transactional email through Resend. Without RESEND_API_KEY the
 * email is printed in development and dropped (with an error log) in
 * production, so a missing key never leaks reset links into logs.
 */
export async function sendEmail(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Clube Descontos Porto <no-reply@clubedescontosporto.pt>";

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[email] RESEND_API_KEY is not set; "${email.subject}" to ${email.to} was not sent`);
    } else {
      console.info(`[email] (dev, not sent) To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
    }
    return;
  }

  resend ??= new Resend(key);
  const { error } = await resend.emails.send({ from, to: email.to, subject: email.subject, text: email.text, html: email.html });
  if (error) throw new Error(`[email] Resend error: ${error.message}`);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal branded layout: one heading, paragraphs and a call-to-action button. */
export function emailLayout({
  lang,
  heading,
  paragraphs,
  cta,
  footer,
}: {
  lang: string;
  heading: string;
  paragraphs: string[];
  cta: { label: string; url: string };
  footer: string;
}): { html: string; text: string } {
  const p = paragraphs.map((x) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#14213D">${escapeHtml(x)}</p>`).join("");
  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#F2F4F8;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#FBFAF6;border-radius:24px;padding:32px" cellpadding="0" cellspacing="0"><tr><td>
<p style="margin:0 0 24px;font-weight:800;font-size:18px;color:#1747A6">Clube Descontos Porto</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.15;color:#0F2D6B">${escapeHtml(heading)}</h1>
${p}
<p style="margin:24px 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#FFC531;color:#14213D;font-weight:800;text-decoration:none;padding:14px 26px;border-radius:999px">${escapeHtml(cta.label)}</a></p>
<p style="margin:24px 0 0;font-size:13px;color:#5A6884">${escapeHtml(footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [heading, "", ...paragraphs, "", `${cta.label}: ${cta.url}`, "", footer].join("\n");
  return { html, text };
}
