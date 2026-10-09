"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { venueSchema } from "@/lib/validation/admin";
import type { FormState } from "../form-state";
import { adminErrors, failed, refreshPublicPages, text } from "./shared";

const FIELDS = ["name", "address", "postalCode", "city", "neighbourhood", "zoneId", "latitude", "longitude", "phone", "website"] as const;

export async function saveVenue(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData.get("id")) || null;
  const raw = Object.fromEntries(FIELDS.map((f) => [f, text(formData.get(f)).replace(",", f === "latitude" || f === "longitude" ? "." : ",")]));
  const parsed = venueSchema.safeParse(raw);
  if (!parsed.success) return { ...failed(adminErrors(parsed.error)), values: raw };
  const v = parsed.data;
  if (!(await db.zone.findUnique({ where: { id: v.zoneId }, select: { id: true } }))) return failed({ zoneId: "required" });

  const data = { ...v, phone: v.phone || null, website: v.website || null };
  const saved = id ? await db.venue.update({ where: { id }, data, select: { id: true } }) : await db.venue.create({ data, select: { id: true } });
  await audit(admin.id, id ? "venue.update" : "venue.create", saved.id, v.name);
  refreshPublicPages();
  revalidatePath("/[locale]/admin", "layout");
  if (!id) redirect({ href: { pathname: `/admin/venues/${saved.id}`, query: { saved: "1" } }, locale: await getLocale() });
  return { ok: true };
}

export async function deleteVenue(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData.get("id"));
  const venue = await db.venue.findUnique({ where: { id }, select: { name: true, _count: { select: { offers: true } } } });
  if (!venue) return failed({ form: "notFound" });
  if (venue._count.offers > 0) return failed({ form: "venueHasOffers" });
  await db.venue.delete({ where: { id } });
  await audit(admin.id, "venue.delete", id, venue.name);
  redirect({ href: { pathname: "/admin/venues", query: { deleted: "1" } }, locale: await getLocale() });
  return {};
}

export type GeocodeResult = { ok: true; latitude: number; longitude: number; label: string } | { ok: false };

/**
 * Address → coordinates via OpenStreetMap Nominatim (admin only, one request
 * per click, which fits Nominatim's usage policy).
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  await requireAdmin();
  const q = query.trim().slice(0, 200);
  if (q.length < 3) return { ok: false };
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pt&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ClubeDescontosPorto/1.0 (backoffice; https://clubedescontosporto.pt)", "Accept-Language": "pt-PT" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!hit) return { ok: false };
    return { ok: true, latitude: Number(hit.lat), longitude: Number(hit.lon), label: hit.display_name };
  } catch {
    return { ok: false };
  }
}
