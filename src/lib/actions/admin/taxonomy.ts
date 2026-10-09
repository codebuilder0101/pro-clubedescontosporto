"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categorySchema, readTranslations, zoneSchema } from "@/lib/validation/admin";
import type { FormState } from "../form-state";
import { adminErrors, failed, refreshPublicPages, text } from "./shared";

/** pt-PT name is required (fallback for the other languages). */
function requirePtName(tr: Record<string, { name: string }>) {
  return tr["pt-PT"]?.name ? null : failed({ "tr.pt-PT.name": "requiredPt" });
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData.get("id")) || null;
  const parsed = categorySchema.safeParse({
    slug: text(formData.get("slug")),
    icon: text(formData.get("icon")),
    tone: text(formData.get("tone")),
    sortOrder: text(formData.get("sortOrder")) || "0",
    translations: readTranslations(formData, ["name"] as const),
  });
  if (!parsed.success) return failed(adminErrors(parsed.error));
  const c = parsed.data;
  const missing = requirePtName(c.translations);
  if (missing) return missing;
  if (await db.category.findFirst({ where: { slug: c.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } })) return failed({ slug: "slugTaken" });

  const tone = c.tone === "ci-cobalt" ? "" : c.tone;
  const saved = await db.$transaction(async (tx) => {
    const row = id
      ? await tx.category.update({ where: { id }, data: { slug: c.slug, icon: c.icon, tone, sortOrder: c.sortOrder }, select: { id: true } })
      : await tx.category.create({ data: { slug: c.slug, icon: c.icon, tone, sortOrder: c.sortOrder }, select: { id: true } });
    for (const l of locales) {
      const name = c.translations[l]?.name;
      if (!name) await tx.categoryTranslation.deleteMany({ where: { categoryId: row.id, locale: l } });
      else
        await tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: row.id, locale: l } },
          create: { categoryId: row.id, locale: l, name },
          update: { name },
        });
    }
    return row;
  });
  await audit(admin.id, id ? "category.update" : "category.create", saved.id, `${c.slug} · ${c.translations["pt-PT"]?.name}`);
  refreshPublicPages();
  revalidatePath("/[locale]/admin", "layout");
  if (!id) redirect({ href: { pathname: `/admin/categories/${saved.id}`, query: { saved: "1" } }, locale: await getLocale() });
  return { ok: true };
}

export async function deleteCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData.get("id"));
  const cat = await db.category.findUnique({ where: { id }, select: { slug: true, _count: { select: { offers: true } } } });
  if (!cat) return failed({ form: "notFound" });
  if (cat._count.offers > 0) return failed({ form: "categoryHasOffers" });
  await db.category.delete({ where: { id } });
  await audit(admin.id, "category.delete", id, cat.slug);
  refreshPublicPages();
  redirect({ href: { pathname: "/admin/categories", query: { deleted: "1" } }, locale: await getLocale() });
  return {};
}

export async function saveZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData.get("id")) || null;
  const parsed = zoneSchema.safeParse({
    slug: text(formData.get("slug")),
    sortOrder: text(formData.get("sortOrder")) || "0",
    translations: readTranslations(formData, ["name"] as const),
  });
  if (!parsed.success) return failed(adminErrors(parsed.error));
  const z = parsed.data;
  const missing = requirePtName(z.translations);
  if (missing) return missing;
  if (await db.zone.findFirst({ where: { slug: z.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } })) return failed({ slug: "slugTaken" });

  const saved = await db.$transaction(async (tx) => {
    const row = id
      ? await tx.zone.update({ where: { id }, data: { slug: z.slug, sortOrder: z.sortOrder }, select: { id: true } })
      : await tx.zone.create({ data: { slug: z.slug, sortOrder: z.sortOrder }, select: { id: true } });
    for (const l of locales) {
      const name = z.translations[l]?.name;
      if (!name) await tx.zoneTranslation.deleteMany({ where: { zoneId: row.id, locale: l } });
      else
        await tx.zoneTranslation.upsert({
          where: { zoneId_locale: { zoneId: row.id, locale: l } },
          create: { zoneId: row.id, locale: l, name },
          update: { name },
        });
    }
    return row;
  });
  await audit(admin.id, id ? "zone.update" : "zone.create", saved.id, `${z.slug} · ${z.translations["pt-PT"]?.name}`);
  refreshPublicPages();
  revalidatePath("/[locale]/admin", "layout");
  if (!id) redirect({ href: { pathname: `/admin/zones/${saved.id}`, query: { saved: "1" } }, locale: await getLocale() });
  return { ok: true };
}

export async function deleteZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData.get("id"));
  const zone = await db.zone.findUnique({ where: { id }, select: { slug: true, _count: { select: { venues: true } } } });
  if (!zone) return failed({ form: "notFound" });
  if (zone._count.venues > 0) return failed({ form: "zoneHasVenues" });
  await db.zone.delete({ where: { id } });
  await audit(admin.id, "zone.delete", id, zone.slug);
  refreshPublicPages();
  redirect({ href: { pathname: "/admin/zones", query: { deleted: "1" } }, locale: await getLocale() });
  return {};
}
