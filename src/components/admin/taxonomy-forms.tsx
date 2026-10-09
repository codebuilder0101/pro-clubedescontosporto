"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";
import { deleteCategory, deleteZone, saveCategory, saveZone } from "@/lib/actions/admin/taxonomy";
import { deleteVenue } from "@/lib/actions/admin/venues";
import { initialFormState, type FormState } from "@/lib/actions/form-state";
import { CATEGORY_ICONS, TONES } from "@/lib/validation/admin";
import { FormAlert } from "../form/field";
import { Icon, type IconName } from "../icon";
import { ConfirmSubmit } from "./confirm-submit";
import { LocaleTabs } from "./locale-tabs";
import { SaveButton, Select, TextInput, useAdminError } from "./fields";

type Names = Partial<Record<Locale, string>>;

function NameTabs({ names, errors }: { names: Names; errors?: Record<string, string> }) {
  const t = useTranslations("Admin");
  const err = useAdminError(errors);
  return (
    <LocaleTabs
      required={["name"]}
      initialComplete={locales.filter((l) => names[l])}
      errorLocales={locales.filter((l) => errors?.[`tr.${l}.name`])}
    >
      {(l) => <TextInput id={`${l}-name`} name={`tr.${l}.name`} label={t("name")} maxLength={60} defaultValue={names[l]} error={err(`tr.${l}.name`)} />}
    </LocaleTabs>
  );
}

function Shell({ state, saved, children }: { state: FormState; saved?: boolean; children: ReactNode }) {
  const t = useTranslations("Admin");
  const hasErrors = Boolean(state.errors && Object.keys(state.errors).length);
  return (
    <>
      {hasErrors && <FormAlert tone="bad">{t("fixErrors")}</FormAlert>}
      {(state.ok || (saved && !hasErrors)) && <FormAlert tone="ok">{t("saved")}</FormAlert>}
      {children}
    </>
  );
}

export function CategoryForm({
  category,
  saved,
}: {
  category: { id?: string; slug: string; icon: string; tone: string; sortOrder: number; names: Names };
  saved?: boolean;
}) {
  const [state, action, pending] = useActionState(saveCategory, initialFormState);
  const t = useTranslations("Admin.taxonomy");
  const ta = useTranslations("Admin");
  const err = useAdminError(state.errors);
  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {category.id && <input type="hidden" name="id" value={category.id} />}
      <Shell state={state} saved={saved}>
        <section className="admin-card grid gap-4 sm:grid-cols-2">
          <TextInput id="c-slug" name="slug" label={t("slug")} defaultValue={category.slug} error={err("slug")} hint={t("slugHint")} required pattern="[a-z0-9-]+" />
          <TextInput id="c-order" name="sortOrder" type="number" min={0} max={999} label={t("sortOrder")} defaultValue={category.sortOrder} error={err("sortOrder")} />
          <Select id="c-icon" name="icon" label={t("icon")} defaultValue={category.icon} options={CATEGORY_ICONS.map((i) => ({ value: i, label: t(`icons.${i}`) }))} />
          <Select id="c-tone" name="tone" label={t("tone")} defaultValue={category.tone || "ci-cobalt"} options={TONES.map((x) => ({ value: x, label: t(`tones.${x}`) }))} />
          <div className="flex items-center gap-3 sm:col-span-2">
            <span className={`ci ${category.tone} [--s:56px]`}>
              <Icon name={category.icon as IconName} />
            </span>
            <span className="a-hint !mt-0">{t("previewHint")}</span>
          </div>
        </section>
        <section className="admin-card">
          <NameTabs names={category.names} errors={state.errors} />
        </section>
      </Shell>
      <div className="flex justify-end">
        <SaveButton pending={pending}>{category.id ? ta("save") : ta("create")}</SaveButton>
      </div>
    </form>
  );
}

export function ZoneForm({ zone, saved }: { zone: { id?: string; slug: string; sortOrder: number; names: Names }; saved?: boolean }) {
  const [state, action, pending] = useActionState(saveZone, initialFormState);
  const t = useTranslations("Admin.taxonomy");
  const ta = useTranslations("Admin");
  const err = useAdminError(state.errors);
  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {zone.id && <input type="hidden" name="id" value={zone.id} />}
      <Shell state={state} saved={saved}>
        <section className="admin-card grid gap-4 sm:grid-cols-2">
          <TextInput id="z-slug" name="slug" label={t("slug")} defaultValue={zone.slug} error={err("slug")} hint={t("slugHint")} required pattern="[a-z0-9-]+" />
          <TextInput id="z-order" name="sortOrder" type="number" min={0} max={999} label={t("sortOrder")} defaultValue={zone.sortOrder} error={err("sortOrder")} />
        </section>
        <section className="admin-card">
          <NameTabs names={zone.names} errors={state.errors} />
        </section>
      </Shell>
      <div className="flex justify-end">
        <SaveButton pending={pending}>{zone.id ? ta("save") : ta("create")}</SaveButton>
      </div>
    </form>
  );
}

const deleters = { venue: deleteVenue, category: deleteCategory, zone: deleteZone };

/** Delete with confirmation; shows why a delete was refused (still in use). */
export function DeleteForm({ kind, id, message }: { kind: keyof typeof deleters; id: string; message: string }) {
  const [state, action] = useActionState(deleters[kind], initialFormState);
  const ta = useTranslations("Admin");
  const err = useAdminError(state.errors);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      {state.errors?.form && <FormAlert tone="bad">{err("form")}</FormAlert>}
      <ConfirmSubmit message={message} className="btn self-start bg-[#fbe7e3] !text-bad">
        <Icon name="trash" className="size-5" />
        {ta("delete")}
      </ConfirmSubmit>
    </form>
  );
}
