import * as z from "zod";
import { locales, type Locale } from "@/i18n/routing";
import { SLUG_PATTERN } from "@/lib/slug";

export const ART_KINDS = ["tasca", "bar", "evento", "cultura", "surf", "cafe", "vinho", "ribeira"] as const;
export const CATEGORY_ICONS = ["fork", "glass", "ticket", "museum", "wave", "cal", "star", "store", "sparkle", "heart", "people", "sun", "globe", "card"] as const;
export const TONES = ["ci-roof", "ci-violet", "ci-sky", "ci-sun", "ci-leaf", "ci-slate", "ci-wine", "ci-cobalt"] as const;
export const OFFER_TRANSLATION_FIELDS = ["title", "summary", "description", "schedule", "conditions", "badge"] as const;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** "12,5" / "12.5" / "" → number | null (NaN for garbage, so validation fails). */
export function decimalOrNull(v: string): number | null {
  if (v === "") return null;
  return /^\d+([.,]\d{1,2})?$/.test(v) ? Number(v.replace(",", ".")) : Number.NaN;
}

export const slugField = z.string().trim().max(80, { error: "tooLong" }).regex(SLUG_PATTERN, { error: "slugInvalid" });

/** Reads `tr.<locale>.<field>` inputs into one record per locale. */
export function readTranslations<F extends string>(formData: FormData, fields: readonly F[]) {
  return Object.fromEntries(
    locales.map((l) => [l, Object.fromEntries(fields.map((f) => [f, str(formData.get(`tr.${l}.${f}`))]))]),
  ) as Record<Locale, Record<F, string>>;
}

export const offerSchema = z
  .object({
    venueId: z.string().min(1, { error: "required" }),
    categoryId: z.string().min(1, { error: "required" }),
    slug: z.union([z.literal(""), slugField]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], { error: "required" }),
    featured: z.boolean(),
    featuredOrder: z.coerce.number({ error: "numberInvalid" }).int({ error: "numberInvalid" }).min(0, { error: "numberInvalid" }).max(999, { error: "numberInvalid" }),
    discountType: z.enum(["PERCENT", "AMOUNT", "TWO_FOR_ONE", "OTHER"], { error: "required" }),
    discountValue: z.number().nullable(),
    maxPeople: z.number().int().min(1, { error: "numberInvalid" }).max(50, { error: "numberInvalid" }).nullable(),
    artKind: z.enum(ART_KINDS, { error: "required" }),
    startsAt: z.date().nullable(),
    endsAt: z.date().nullable(),
    translations: z.record(
      z.enum(locales),
      z.object({
        title: z.string().max(120, { error: "tooLong" }),
        summary: z.string().max(160, { error: "tooLong" }),
        description: z.string().max(3000, { error: "tooLong" }),
        schedule: z.string().max(160, { error: "tooLong" }),
        conditions: z.string().max(2000, { error: "tooLong" }),
        badge: z.string().max(20, { error: "tooLong" }),
      }),
    ),
  })
  .superRefine((o, ctx) => {
    const v = o.discountValue;
    if (o.discountType === "PERCENT" && (v === null || Number.isNaN(v) || v <= 0 || v > 100 || !Number.isInteger(v))) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "percentInvalid" });
    }
    if (o.discountType === "AMOUNT" && (v === null || Number.isNaN(v) || v <= 0 || v > 1000)) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "amountInvalid" });
    }
    if (o.startsAt && o.endsAt && o.endsAt <= o.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "endBeforeStart" });
    }
    // pt-PT is the fallback for every other language, so it must be complete.
    const pt = o.translations["pt-PT"];
    for (const f of ["title", "summary", "description"] as const) {
      if (!pt?.[f]) ctx.addIssue({ code: "custom", path: [`tr.pt-PT.${f}`], message: "requiredPt" });
    }
    if (o.discountType === "OTHER" && !pt?.badge) {
      ctx.addIssue({ code: "custom", path: ["tr.pt-PT.badge"], message: "requiredPt" });
    }
  });

export const venueSchema = z.object({
  name: z.string().trim().min(2, { error: "required" }).max(120, { error: "tooLong" }),
  address: z.string().trim().min(3, { error: "required" }).max(200, { error: "tooLong" }),
  postalCode: z.string().trim().regex(/^\d{4}-\d{3}$/, { error: "postalInvalid" }),
  city: z.string().trim().min(2, { error: "required" }).max(80, { error: "tooLong" }),
  neighbourhood: z.string().trim().min(2, { error: "required" }).max(80, { error: "tooLong" }),
  zoneId: z.string().min(1, { error: "required" }),
  latitude: z.coerce.number({ error: "coordsInvalid" }).min(-90, { error: "coordsInvalid" }).max(90, { error: "coordsInvalid" }),
  longitude: z.coerce.number({ error: "coordsInvalid" }).min(-180, { error: "coordsInvalid" }).max(180, { error: "coordsInvalid" }),
  phone: z.string().trim().max(30, { error: "tooLong" }).regex(/^[+0-9 ()-]*$/, { error: "phoneInvalid" }),
  website: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "urlInvalid" }).max(300, { error: "tooLong" })]),
});

export const nameTranslationsSchema = z.record(z.enum(locales), z.object({ name: z.string().max(60, { error: "tooLong" }) }));

export const categorySchema = z.object({
  slug: slugField,
  icon: z.enum(CATEGORY_ICONS, { error: "required" }),
  tone: z.enum(TONES, { error: "required" }),
  sortOrder: z.coerce.number({ error: "numberInvalid" }).int({ error: "numberInvalid" }).min(0, { error: "numberInvalid" }).max(999, { error: "numberInvalid" }),
  translations: nameTranslationsSchema,
});

export const zoneSchema = z.object({
  slug: slugField,
  sortOrder: z.coerce.number({ error: "numberInvalid" }).int({ error: "numberInvalid" }).min(0, { error: "numberInvalid" }).max(999, { error: "numberInvalid" }),
  translations: nameTranslationsSchema,
});
