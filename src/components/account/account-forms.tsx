"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { changeEmail, changePassword, deleteAccount, updateProfile } from "@/lib/actions/account";
import { initialFormState, type FormState } from "@/lib/actions/form-state";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import { Field, FormAlert } from "../form/field";
import { PasswordField } from "../form/password-field";
import { useFocusFirstError } from "../form/use-focus-error";
import { Icon } from "../icon";

function useForm(action: (s: FormState, f: FormData) => Promise<FormState>) {
  const [state, run, pending] = useActionState(action, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const t = useTranslations("AccountSettings");
  const err = (key: string) => (state.errors?.[key] ? t(`errors.${state.errors[key]}`) : undefined);
  return { state, run, pending, form, err, t };
}

function Save({ pending, label, tone = "blue" }: { pending: boolean; label: string; tone?: "blue" | "bad" }) {
  const t = useTranslations("AccountSettings");
  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn !h-auto self-start !py-3 text-center !whitespace-normal disabled:opacity-70 ${tone === "bad" ? "bg-bad text-white" : "btn-blue"}`}
    >
      {pending ? t("saving") : label}
    </button>
  );
}

export function ProfileForm({ name, locale, saved }: { name: string; locale: Locale; saved: boolean }) {
  const { state, run, pending, form, err, t } = useForm(updateProfile);
  const tl = useTranslations("LocaleSwitcher");
  return (
    <form ref={form} action={run} noValidate className="flex flex-col gap-4">
      {saved && !state.errors && <FormAlert tone="ok">{t("profileSaved")}</FormAlert>}
      <Field id="acc-name" name="name" label={t("name")} icon="user" autoComplete="name" required maxLength={80} defaultValue={state.values?.name ?? name} error={err("name")} />
      <div>
        <label className="field" htmlFor="acc-locale">
          <span className="field-icon" aria-hidden="true">
            <Icon name="globe" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="field-label">{t("language")}</span>
            <select id="acc-locale" name="preferredLocale" defaultValue={locale}>
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeLabels[l]} · {tl(l)}
                </option>
              ))}
            </select>
          </span>
          <Icon name="chev" className="size-5 flex-none text-mute" aria-hidden="true" />
        </label>
        <p className="mt-1.5 ml-3.5 text-[15px] text-mute">{t("languageHint")}</p>
      </div>
      <Save pending={pending} label={t("saveProfile")} />
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const { state, run, pending, form, err, t } = useForm(changeEmail);
  return (
    <form ref={form} action={run} noValidate className="flex flex-col gap-4">
      {state.ok && <FormAlert tone="ok">{t("emailSaved", { email: state.values?.email ?? "" })}</FormAlert>}
      <p className="text-[15px] text-mute">{t("emailCurrent", { email })}</p>
      <Field id="acc-email" name="email" type="email" inputMode="email" autoComplete="email" required label={t("newEmail")} icon="mail" defaultValue={state.ok ? "" : state.values?.email} error={err("email")} />
      <PasswordField id="acc-email-pw" name="password" autoComplete="current-password" required label={t("currentPassword")} error={err("password")} />
      <Save pending={pending} label={t("saveEmail")} />
    </form>
  );
}

export function PasswordForm() {
  const { state, run, pending, form, err, t } = useForm(changePassword);
  return (
    <form ref={form} action={run} noValidate className="flex flex-col gap-4">
      {state.ok && <FormAlert tone="ok">{t("passwordSaved")}</FormAlert>}
      <PasswordField id="acc-pw-current" name="current" autoComplete="current-password" required label={t("currentPassword")} error={err("current")} />
      <PasswordField id="acc-pw-new" name="password" autoComplete="new-password" required minLength={8} maxLength={128} label={t("newPassword")} hint={t("passwordHint")} error={err("password")} />
      <Save pending={pending} label={t("savePassword")} />
    </form>
  );
}

export function DeleteAccountForm() {
  const { state, run, pending, form, err, t } = useForm(deleteAccount);
  return (
    <form ref={form} action={run} noValidate className="flex flex-col gap-4">
      {state.errors?.form && <FormAlert tone="bad">{err("form")}</FormAlert>}
      <p className="text-[15px] text-mute">{t("deleteText")}</p>
      <PasswordField id="acc-del-pw" name="password" autoComplete="current-password" required label={t("currentPassword")} error={err("password")} />
      <div>
        <label className="check">
          <input type="checkbox" name="confirm" aria-invalid={state.errors?.confirm ? true : undefined} />
          <span>{t("deleteConfirm")}</span>
        </label>
        {state.errors?.confirm && <p className="field-error">{err("confirm")}</p>}
      </div>
      <Save pending={pending} label={t("deleteSubmit")} tone="bad" />
    </form>
  );
}
