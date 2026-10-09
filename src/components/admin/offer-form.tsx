"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";
import { saveOffer } from "@/lib/actions/admin/offers";
import { initialFormState } from "@/lib/actions/form-state";
import { ART_KINDS } from "@/lib/validation/admin";
import { FormAlert } from "../form/field";
import { LocaleTabs } from "./locale-tabs";
import { SaveButton, Select, TextArea, TextInput, useAdminError } from "./fields";

export type OfferFormData = {
  id?: string;
  slug: string;
  venueId: string;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  featuredOrder: number;
  discountType: "PERCENT" | "AMOUNT" | "TWO_FOR_ONE" | "OTHER";
  discountValue: number | null;
  maxPeople: number | null;
  artKind: string;
  startsAt: string;
  endsAt: string;
  translations: Partial<Record<Locale, { title: string; summary: string; description: string; schedule: string; conditions: string; badge: string }>>;
};

type Option = { value: string; label: string };

export function OfferForm({ offer, venues, categories, saved }: { offer: OfferFormData; venues: Option[]; categories: Option[]; saved?: boolean }) {
  const [state, action, pending] = useActionState(saveOffer, initialFormState);
  const t = useTranslations("Admin.offerForm");
  const ta = useTranslations("Admin");
  const err = useAdminError(state.errors);
  const [type, setType] = useState(offer.discountType);

  const complete = locales.filter((l) => {
    const tr = offer.translations[l];
    return tr?.title && tr.summary && tr.description;
  });
  const errorLocales = locales.filter((l) => Object.keys(state.errors ?? {}).some((k) => k.startsWith(`tr.${l}.`)));
  const hasErrors = Boolean(state.errors && Object.keys(state.errors).length);

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {offer.id && <input type="hidden" name="id" value={offer.id} />}
      {hasErrors && <FormAlert tone="bad">{ta("fixErrors")}</FormAlert>}
      {(state.ok || (saved && !hasErrors)) && <FormAlert tone="ok">{ta("saved")}</FormAlert>}

      <section className="admin-card grid gap-4 sm:grid-cols-2">
        <h2 className="text-xl font-bold sm:col-span-2">{t("main")}</h2>
        <Select id="o-venue" name="venueId" label={t("venue")} options={venues} placeholder={t("choose")} defaultValue={offer.venueId} error={err("venueId")} required />
        <Select id="o-category" name="categoryId" label={t("category")} options={categories} placeholder={t("choose")} defaultValue={offer.categoryId} error={err("categoryId")} required />
        <Select
          id="o-status"
          name="status"
          label={t("status")}
          defaultValue={offer.status}
          options={(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => ({ value: s, label: ta(`status.${s}`) }))}
          hint={t("statusHint")}
        />
        <TextInput id="o-slug" name="slug" label={t("slug")} defaultValue={offer.slug} error={err("slug")} hint={t("slugHint")} pattern="[a-z0-9-]*" />
        <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
          <label className="check !text-ink">
            <input type="checkbox" name="featured" defaultChecked={offer.featured} />
            <span className="font-bold">{t("featured")}</span>
          </label>
          <TextInput id="o-forder" name="featuredOrder" type="number" min={0} max={999} label={t("featuredOrder")} defaultValue={offer.featuredOrder} error={err("featuredOrder")} className="w-40" />
        </div>
      </section>

      <section className="admin-card grid gap-4 sm:grid-cols-3">
        <h2 className="text-xl font-bold sm:col-span-3">{t("discount")}</h2>
        <Select
          id="o-dtype"
          name="discountType"
          label={t("discountType")}
          value={type}
          onChange={(e) => setType(e.target.value as OfferFormData["discountType"])}
          options={(["PERCENT", "AMOUNT", "TWO_FOR_ONE", "OTHER"] as const).map((d) => ({ value: d, label: t(`type.${d}`) }))}
        />
        {(type === "PERCENT" || type === "AMOUNT") && (
          <TextInput
            id="o-dvalue"
            name="discountValue"
            inputMode="decimal"
            label={type === "PERCENT" ? t("percent") : t("amount")}
            defaultValue={offer.discountValue ?? ""}
            error={err("discountValue")}
          />
        )}
        <TextInput id="o-people" name="maxPeople" type="number" min={1} max={50} label={t("maxPeople")} defaultValue={offer.maxPeople ?? ""} error={err("maxPeople")} hint={t("maxPeopleHint")} />
        {type === "OTHER" && <p className="a-hint sm:col-span-3">{t("otherHint")}</p>}
      </section>

      <section className="admin-card grid gap-4 sm:grid-cols-3">
        <h2 className="text-xl font-bold sm:col-span-3">{t("availability")}</h2>
        <TextInput id="o-start" name="startsAt" type="datetime-local" label={t("startsAt")} defaultValue={offer.startsAt} error={err("startsAt")} hint={t("timezoneHint")} />
        <TextInput id="o-end" name="endsAt" type="datetime-local" label={t("endsAt")} defaultValue={offer.endsAt} error={err("endsAt")} />
        <Select
          id="o-art"
          name="artKind"
          label={t("illustration")}
          defaultValue={offer.artKind}
          options={ART_KINDS.map((a) => ({ value: a, label: t(`art.${a}`) }))}
          hint={t("illustrationHint")}
        />
      </section>

      <section className="admin-card flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t("texts")}</h2>
        <LocaleTabs required={["title", "summary", "description"]} initialComplete={complete} errorLocales={errorLocales}>
          {(l) => {
            const tr = offer.translations[l];
            const f = (name: string) => `tr.${l}.${name}`;
            return (
              <>
                <TextInput id={`${l}-title`} name={f("title")} label={t("title")} maxLength={120} defaultValue={tr?.title} error={err(f("title"))} hint={t("titleHint")} />
                <TextInput id={`${l}-summary`} name={f("summary")} label={t("summary")} maxLength={160} defaultValue={tr?.summary} error={err(f("summary"))} hint={t("summaryHint")} />
                <TextArea id={`${l}-desc`} name={f("description")} label={t("description")} maxLength={3000} rows={5} defaultValue={tr?.description} error={err(f("description"))} />
                <TextInput id={`${l}-schedule`} name={f("schedule")} label={t("schedule")} maxLength={160} defaultValue={tr?.schedule} error={err(f("schedule"))} hint={t("scheduleHint")} />
                <TextArea id={`${l}-cond`} name={f("conditions")} label={t("conditions")} rows={4} defaultValue={tr?.conditions} error={err(f("conditions"))} hint={t("conditionsHint")} />
                <TextInput id={`${l}-badge`} name={f("badge")} label={t("badge")} maxLength={20} defaultValue={tr?.badge} error={err(f("badge"))} hint={t("badgeHint")} />
              </>
            );
          }}
        </LocaleTabs>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <SaveButton pending={pending}>{offer.id ? ta("save") : t("create")}</SaveButton>
      </div>
    </form>
  );
}
