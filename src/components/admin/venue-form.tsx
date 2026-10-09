"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { geocodeAddress, saveVenue } from "@/lib/actions/admin/venues";
import { initialFormState } from "@/lib/actions/form-state";
import { FormAlert } from "../form/field";
import { Icon } from "../icon";
import { MapPicker } from "./map-picker";
import { SaveButton, Select, TextInput, useAdminError } from "./fields";

export type VenueFormData = {
  id?: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  neighbourhood: string;
  zoneId: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  website: string;
};

export function VenueForm({ venue, zones, saved }: { venue: VenueFormData; zones: { value: string; label: string }[]; saved?: boolean }) {
  const [state, action, pending] = useActionState(saveVenue, initialFormState);
  const t = useTranslations("Admin.venueForm");
  const ta = useTranslations("Admin");
  const err = useAdminError(state.errors);
  const [coords, setCoords] = useState({ lat: venue.latitude, lng: venue.longitude });
  const [geo, setGeo] = useState<"idle" | "notFound" | "found">("idle");
  const [geocoding, startGeocode] = useTransition();
  const v = (k: keyof VenueFormData) => (state.values?.[k] as string | undefined) ?? (venue[k] === null ? "" : String(venue[k] ?? ""));
  const hasErrors = Boolean(state.errors && Object.keys(state.errors).length);

  const findAddress = (form: HTMLFormElement | null) => {
    if (!form) return;
    const fd = new FormData(form);
    const q = [fd.get("address"), fd.get("postalCode"), fd.get("city")].filter(Boolean).join(", ");
    startGeocode(async () => {
      const res = await geocodeAddress(q);
      if (res.ok) {
        setCoords({ lat: Number(res.latitude.toFixed(6)), lng: Number(res.longitude.toFixed(6)) });
        setGeo("found");
      } else setGeo("notFound");
    });
  };

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {venue.id && <input type="hidden" name="id" value={venue.id} />}
      {hasErrors && <FormAlert tone="bad">{ta("fixErrors")}</FormAlert>}
      {(state.ok || (saved && !hasErrors)) && <FormAlert tone="ok">{ta("saved")}</FormAlert>}
      <section className="admin-card grid gap-4 sm:grid-cols-2">
        <TextInput id="v-name" name="name" label={t("name")} defaultValue={v("name")} error={err("name")} required maxLength={120} className="sm:col-span-2" />
        <TextInput id="v-address" name="address" label={t("address")} defaultValue={v("address")} error={err("address")} required maxLength={200} className="sm:col-span-2" />
        <TextInput id="v-postal" name="postalCode" label={t("postalCode")} placeholder="4050-253" defaultValue={v("postalCode")} error={err("postalCode")} required />
        <TextInput id="v-city" name="city" label={t("city")} defaultValue={v("city") || "Porto"} error={err("city")} required maxLength={80} />
        <TextInput id="v-neigh" name="neighbourhood" label={t("neighbourhood")} defaultValue={v("neighbourhood")} error={err("neighbourhood")} required maxLength={80} hint={t("neighbourhoodHint")} />
        <Select id="v-zone" name="zoneId" label={t("zone")} options={zones} placeholder={t("choose")} defaultValue={v("zoneId")} error={err("zoneId")} required />
        <TextInput id="v-phone" name="phone" type="tel" label={t("phone")} defaultValue={v("phone")} error={err("phone")} maxLength={30} />
        <TextInput id="v-web" name="website" type="url" label={t("website")} placeholder="https://" defaultValue={v("website")} error={err("website")} maxLength={300} />
      </section>
      <section className="admin-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t("location")}</h2>
          <button type="button" onClick={(e) => findAddress(e.currentTarget.form)} disabled={geocoding} className="btn btn-ghost !min-h-[46px] !px-4 !text-[15px]">
            <Icon name="search" className="size-5" />
            {geocoding ? ta("saving") : t("findAddress")}
          </button>
        </div>
        <p className="a-hint !mt-0">{t("locationHint")}</p>
        {geo === "notFound" && <FormAlert tone="info">{t("notFound")}</FormAlert>}
        <MapPicker latitude={coords.lat} longitude={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} label={t("mapLabel")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="v-lat" name="latitude" inputMode="decimal" label={t("latitude")} value={coords.lat ?? ""} onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value === "" ? null : Number(e.target.value) }))} error={err("latitude")} required />
          <TextInput id="v-lng" name="longitude" inputMode="decimal" label={t("longitude")} value={coords.lng ?? ""} onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value === "" ? null : Number(e.target.value) }))} error={err("longitude")} required />
        </div>
      </section>
      <div className="sticky bottom-4 z-10 flex justify-end">
        <SaveButton pending={pending}>{venue.id ? ta("save") : t("create")}</SaveButton>
      </div>
    </form>
  );
}
