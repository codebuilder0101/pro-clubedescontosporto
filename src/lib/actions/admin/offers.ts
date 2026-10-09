"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { deleteOfferImageFiles, saveOfferImage } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { lisbonInputToDate } from "@/lib/timezone";
import { decimalOrNull, OFFER_TRANSLATION_FIELDS, offerSchema, readTranslations } from "@/lib/validation/admin";
import type { FormState } from "../form-state";
import { adminErrors, failed, refreshPublicPages, text } from "./shared";

const MAX_IMAGES = 8;

async function uniqueOfferSlug(base: string, exceptId?: string): Promise<string> {
  const root = base || "oferta";
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const taken = await db.offer.findFirst({ where: { slug: candidate, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function saveOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const locale = await getLocale();
  const id = text(formData.get("id")) || null;

  const dateField = (name: string) => {
    const v = text(formData.get(name));
    return v === "" ? null : lisbonInputToDate(v);
  };
  const startsRaw = text(formData.get("startsAt"));
  const endsRaw = text(formData.get("endsAt"));
  const startsAt = dateField("startsAt");
  const endsAt = dateField("endsAt");
  if ((startsRaw && !startsAt) || (endsRaw && !endsAt)) return failed({ [startsRaw && !startsAt ? "startsAt" : "endsAt"]: "dateInvalid" });

  const maxPeopleRaw = text(formData.get("maxPeople"));
  const parsed = offerSchema.safeParse({
    venueId: text(formData.get("venueId")),
    categoryId: text(formData.get("categoryId")),
    slug: text(formData.get("slug")),
    status: text(formData.get("status")),
    featured: formData.get("featured") === "on",
    featuredOrder: text(formData.get("featuredOrder")) || "0",
    discountType: text(formData.get("discountType")),
    discountValue: decimalOrNull(text(formData.get("discountValue"))),
    maxPeople: maxPeopleRaw === "" ? null : Number(maxPeopleRaw),
    artKind: text(formData.get("artKind")),
    startsAt,
    endsAt,
    translations: readTranslations(formData, OFFER_TRANSLATION_FIELDS),
  });
  if (!parsed.success) return failed(adminErrors(parsed.error));
  const o = parsed.data;

  const venue = await db.venue.findUnique({ where: { id: o.venueId }, select: { name: true } });
  if (!venue) return failed({ venueId: "required" });
  if (!(await db.category.findUnique({ where: { id: o.categoryId }, select: { id: true } }))) return failed({ categoryId: "required" });

  const slug = o.slug || (await uniqueOfferSlug(slugify(venue.name), id ?? undefined));
  const clash = await db.offer.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (clash) return failed({ slug: "slugTaken" });

  const data = {
    slug,
    venueId: o.venueId,
    categoryId: o.categoryId,
    status: o.status,
    featured: o.featured,
    featuredOrder: o.featuredOrder,
    discountType: o.discountType,
    discountValue: o.discountType === "PERCENT" || o.discountType === "AMOUNT" ? o.discountValue : null,
    maxPeople: o.maxPeople,
    artKind: o.artKind,
    startsAt: o.startsAt,
    endsAt: o.endsAt,
  };

  const offerId = await db.$transaction(async (tx) => {
    const saved = id ? await tx.offer.update({ where: { id }, data, select: { id: true } }) : await tx.offer.create({ data, select: { id: true } });
    for (const l of locales) {
      const tr = o.translations[l];
      const conditions = (tr?.conditions ?? "").split("\n").map((c) => c.trim()).filter(Boolean);
      // A language with no title is "not translated yet": the site falls back to pt-PT.
      if (!tr?.title) {
        await tx.offerTranslation.deleteMany({ where: { offerId: saved.id, locale: l } });
        continue;
      }
      const row = {
        title: tr.title,
        summary: tr.summary,
        description: tr.description,
        schedule: tr.schedule || null,
        conditions,
        badge: tr.badge || null,
      };
      await tx.offerTranslation.upsert({
        where: { offerId_locale: { offerId: saved.id, locale: l } },
        create: { offerId: saved.id, locale: l, ...row },
        update: row,
      });
    }
    return saved.id;
  });

  await audit(admin.id, id ? "offer.update" : "offer.create", offerId, `${venue.name} · ${o.translations["pt-PT"]?.title} · ${o.status}`);
  refreshPublicPages();
  revalidatePath("/[locale]/admin", "layout");
  if (!id) redirect({ href: { pathname: `/admin/offers/${offerId}`, query: { saved: "1" } }, locale });
  return { ok: true };
}

export async function deleteOffer(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = text(formData.get("id"));
  const offer = await db.offer.findUnique({ where: { id }, select: { slug: true, images: { select: { fileName: true } } } });
  if (offer) {
    await db.offer.delete({ where: { id } });
    for (const img of offer.images) await deleteOfferImageFiles(img.fileName);
    await audit(admin.id, "offer.delete", id, offer.slug);
    refreshPublicPages();
  }
  redirect({ href: { pathname: "/admin/offers", query: { deleted: "1" } }, locale: await getLocale() });
}

/** Copies an offer (without photos) as a draft. */
export async function duplicateOffer(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = text(formData.get("id"));
  const src = await db.offer.findUnique({ where: { id }, include: { translations: true } });
  if (!src) return;
  const slug = await uniqueOfferSlug(`${src.slug}-copia`);
  const copy = await db.offer.create({
    data: {
      slug,
      venueId: src.venueId,
      categoryId: src.categoryId,
      status: "DRAFT",
      featured: false,
      featuredOrder: src.featuredOrder,
      discountType: src.discountType,
      discountValue: src.discountValue,
      maxPeople: src.maxPeople,
      artKind: src.artKind,
      startsAt: src.startsAt,
      endsAt: src.endsAt,
      translations: {
        create: src.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          summary: t.summary,
          description: t.description,
          schedule: t.schedule,
          conditions: t.conditions,
          badge: t.badge,
        })),
      },
    },
    select: { id: true },
  });
  await audit(admin.id, "offer.duplicate", copy.id, `${src.slug} → ${slug}`);
  redirect({ href: `/admin/offers/${copy.id}`, locale: await getLocale() });
}

// ---------- Photos ----------

export async function uploadOfferImages(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const offerId = text(formData.get("offerId"));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return failed({ images: "imageMissing" });

  const existing = await db.offerImage.count({ where: { offerId } });
  if (!(await db.offer.findUnique({ where: { id: offerId }, select: { id: true } }))) return failed({ images: "required" });
  if (existing + files.length > MAX_IMAGES) return failed({ images: "imageTooMany" });

  let order = existing;
  for (const file of files) {
    const saved = await saveOfferImage(file);
    if ("error" in saved) return failed({ images: saved.error });
    await db.offerImage.create({ data: { offerId, fileName: saved.fileName, width: saved.width, height: saved.height, sortOrder: order++ } });
  }
  await audit(admin.id, "offer.images.add", offerId, `${files.length} photo(s)`);
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true };
}

export async function deleteOfferImage(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = text(formData.get("imageId"));
  const img = await db.offerImage.findUnique({ where: { id }, select: { fileName: true, offerId: true } });
  if (!img) return;
  await db.offerImage.delete({ where: { id } });
  await deleteOfferImageFiles(img.fileName);
  await audit(admin.id, "offer.images.delete", img.offerId, img.fileName);
  revalidatePath("/[locale]/admin", "layout");
}

/** Moves a photo one place up or down (the first photo is the cover). */
export async function moveOfferImage(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData.get("imageId"));
  const dir = text(formData.get("dir")) === "up" ? -1 : 1;
  const img = await db.offerImage.findUnique({ where: { id }, select: { offerId: true } });
  if (!img) return;
  const list = await db.offerImage.findMany({ where: { offerId: img.offerId }, orderBy: { sortOrder: "asc" }, select: { id: true } });
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((x, k) => db.offerImage.update({ where: { id: x.id }, data: { sortOrder: k } })));
  revalidatePath("/[locale]/admin", "layout");
}

