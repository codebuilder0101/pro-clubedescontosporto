import * as z from "zod";

export const SEARCH_PAGE_SIZE = 12;

const slug = z
  .string()
  .regex(/^[a-z0-9-]{1,40}$/)
  .optional()
  .catch(undefined);

/** Validated /explore query string. Invalid values are dropped, never thrown. */
export const searchParamsSchema = z.object({
  q: z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim().slice(0, 80))
    .optional()
    .catch(undefined),
  category: slug,
  zone: slug,
  page: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
});

export type SearchQuery = { q: string; category?: string; zone?: string; page: number };

/** Accepts Next's searchParams object (values may be arrays). */
export function parseSearchQuery(raw: Record<string, string | string[] | undefined>): SearchQuery {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const parsed = searchParamsSchema.parse({
    q: first(raw.q),
    category: first(raw.category),
    zone: first(raw.zone),
    page: first(raw.page),
  });
  return { q: parsed.q ?? "", category: parsed.category, zone: parsed.zone, page: parsed.page ?? 1 };
}

/**
 * Search terms: lower-cased words of 2+ characters, at most 6. Accent folding
 * happens in SQL (f_unaccent), so "cafe" finds "Café".
 */
export function searchTerms(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,.;:!?"'()]+/)
    .filter((w) => w.length >= 2)
    .slice(0, 6);
}

/** Escapes LIKE wildcards so a user's "%" or "_" matches literally. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}
