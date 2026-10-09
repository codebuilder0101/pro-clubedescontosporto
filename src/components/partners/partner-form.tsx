"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitPartnerRequest } from "@/lib/actions/partners";
import { initialFormState } from "@/lib/actions/form-state";
import { Field, FormAlert } from "../form/field";
import { SubmitButton } from "../form/submit-button";
import { useFocusFirstError } from "../form/use-focus-error";
import { Icon } from "../icon";

export function PartnerForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const [state, action] = useActionState(submitPartnerRequest, initialFormState);
  const t = useTranslations("Partners");
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const err = (key: string) => (state.errors?.[key] ? t(`errors.${state.errors[key]}`) : undefined);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <span className="ci ci-leaf [--s:72px]">
          <Icon name="check" />
        </span>
        <h2 className="text-3xl font-extrabold">{t("sentTitle")}</h2>
        <p className="text-mute">{t("sentText")}</p>
        <Link href="/" className="btn btn-ghost">
          {t("backHome")}
        </Link>
      </div>
    );
  }

  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-4">
      {state.errors?.form && <FormAlert tone="bad">{err("form")}</FormAlert>}
      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field id="pr-business" name="businessName" label={t("businessName")} icon="store" required maxLength={120} defaultValue={v.businessName} error={err("businessName")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pr-contact" name="contactName" label={t("contactName")} icon="user" autoComplete="name" required maxLength={80} defaultValue={v.contactName} error={err("contactName")} />
        <Field id="pr-phone" name="phone" type="tel" label={t("phone")} icon="phone" autoComplete="tel" maxLength={30} defaultValue={v.phone} error={err("phone")} />
      </div>
      <Field id="pr-email" name="email" type="email" inputMode="email" label={t("email")} icon="mail" autoComplete="email" required defaultValue={v.email} error={err("email")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field" htmlFor="pr-category">
          <span className="field-icon" aria-hidden="true">
            <Icon name="grid" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="field-label">{t("category")}</span>
            <select id="pr-category" name="categorySlug" defaultValue={v.categorySlug ?? ""}>
              <option value="">{t("categoryAny")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </span>
          <Icon name="chev" className="size-5 flex-none text-mute" aria-hidden="true" />
        </label>
        <Field id="pr-city" name="city" label={t("city")} icon="pin" required maxLength={80} placeholder={t("cityPlaceholder")} defaultValue={v.city} error={err("city")} />
      </div>
      <div>
        <div className="field !items-start" data-invalid={state.errors?.message ? "true" : undefined}>
          <span className="field-icon mt-1" aria-hidden="true">
            <Icon name="edit" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <label htmlFor="pr-message" className="field-label">
              {t("message")}
            </label>
            <textarea
              id="pr-message"
              name="message"
              rows={5}
              required
              maxLength={2000}
              defaultValue={v.message}
              placeholder={t("messagePlaceholder")}
              aria-invalid={state.errors?.message ? true : undefined}
              aria-describedby={state.errors?.message ? "pr-message-error" : undefined}
              className="w-full resize-y bg-transparent font-semibold text-ink outline-none"
            />
          </span>
        </div>
        {state.errors?.message && (
          <p id="pr-message-error" className="field-error">
            {err("message")}
          </p>
        )}
      </div>
      <div>
        <label className="check">
          <input type="checkbox" name="consent" aria-invalid={state.errors?.consent ? true : undefined} />
          <span>
            {t.rich("consent", {
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {state.errors?.consent && <p className="field-error">{err("consent")}</p>}
      </div>
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
