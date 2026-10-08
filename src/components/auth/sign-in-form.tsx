"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signIn } from "@/lib/actions/auth";
import { FEATURES } from "@/lib/features";
import { initialFormState } from "@/lib/actions/form-state";
import { Field, FormAlert } from "../form/field";
import { PasswordField } from "../form/password-field";
import { SubmitButton } from "../form/submit-button";
import { useFocusFirstError } from "../form/use-focus-error";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialFormState);
  const t = useTranslations("Login");
  const ta = useTranslations("Auth");
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const err = (key: string) => (state.errors?.[key] ? ta(`errors.${state.errors[key]}`) : undefined);

  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-4">
      {state.errors?.form && <FormAlert tone="bad">{err("form")}</FormAlert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Field
        id="login-email"
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
      <PasswordField
        id="login-password"
        name="password"
        autoComplete="current-password"
        required
        label={ta("passwordLabel")}
        error={err("password")}
      />
      {FEATURES.passwordReset && (
        <Link href="/forgot-password" className="self-end text-[15px] font-extrabold text-cobalt underline-offset-4 hover:underline">
          {t("forgot")}
        </Link>
      )}
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
