import { createHash, randomBytes } from "node:crypto";

/** 256-bit random token, URL-safe. Sent to the user (cookie or email link). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What we store: the SHA-256 of a token, so a database leak exposes no usable tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
