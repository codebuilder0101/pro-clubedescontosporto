"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/actions/form-state";
import { Field, FormAlert } from "../form/field";
import { SubmitButton } from "../form/submit-button";
import { useFocusFirstError } from "../form/use-focus-error";

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  const t = useTranslations("Forgot");
  const ta = useTranslations("Auth");
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const err = (key: string) => (state.errors?.[key] ? ta(`errors.${state.errors[key]}`) : undefined);

  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-4">
      {state.errors?.form && <FormAlert tone="bad">{err("form")}</FormAlert>}
      {state.ok && <FormAlert tone="ok">{t("sent", { email: state.values?.email ?? "" })}</FormAlert>}
      <Field
        id="forgot-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        label={ta("emailLabel")}
        placeholder={ta("emailPlaceholder")}
        icon="mail"
        defaultValue={state.values?.email}
        error={err("email")}
      />
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
