/**
 * Validates a `next` parameter (where to go after sign-in) so it can only
 * point inside this site: a locale-less path such as "/offers/abc?x=1".
 * Anything else (absolute URLs, "//evil.com", backslashes, control
 * characters) returns null, which closes the open-redirect hole.
 */
export function safeNextPath(input: unknown): string | null {
  if (typeof input !== "string" || input.length === 0 || input.length > 512) return null;
  if (!input.startsWith("/") || input.startsWith("//") || input.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(input)) return null;

  const base = "http://internal.invalid";
  let url: URL;
  try {
    url = new URL(input, base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;
  return url.pathname + url.search;
}
