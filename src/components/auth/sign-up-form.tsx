"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signUp } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/actions/form-state";
import { Field, FormAlert } from "../form/field";
import { PasswordField } from "../form/password-field";
import { SubmitButton } from "../form/submit-button";
import { useFocusFirstError } from "../form/use-focus-error";

export function SignUpForm({ plan }: { plan?: string }) {
  const [state, action] = useActionState(signUp, initialFormState);
  const t = useTranslations("Join");
  const ta = useTranslations("Auth");
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const err = (key: string) => (state.errors?.[key] ? ta(`errors.${state.errors[key]}`) : undefined);

  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-4">
      {state.errors?.form && <FormAlert tone="bad">{err("form")}</FormAlert>}
      {plan && <input type="hidden" name="plan" value={plan} />}
      <Field
        id="join-name"
        name="name"
        autoComplete="name"
        required
        maxLength={80}
        label={ta("nameLabel")}
        placeholder={ta("namePlaceholder")}
        icon="user"
        defaultValue={state.values?.name}
        error={err("name")}
      />
      <Field
        id="join-email"
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
        id="join-password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        label={ta("passwordLabel")}
        hint={ta("passwordHint")}
        error={err("password")}
      />
      <div>
        <label className="check">
          <input type="checkbox" name="terms" required aria-invalid={state.errors?.terms ? true : undefined} aria-describedby={state.errors?.terms ? "join-terms-error" : undefined} />
          <span>
            {ta.rich("terms", {
              terms: (chunks) => (
                <Link href="/terms" target="_blank">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {state.errors?.terms && (
          <p id="join-terms-error" className="field-error">
            {err("terms")}
          </p>
        )}
      </div>
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
