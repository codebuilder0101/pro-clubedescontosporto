"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resetPassword } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/actions/form-state";
import { FormAlert } from "../form/field";
import { PasswordField } from "../form/password-field";
import { SubmitButton } from "../form/submit-button";
import { useFocusFirstError } from "../form/use-focus-error";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initialFormState);
  const t = useTranslations("Reset");
  const ta = useTranslations("Auth");
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const err = (key: string) => (state.errors?.[key] ? ta(`errors.${state.errors[key]}`) : undefined);

  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-4">
      {state.errors?.form && (
        <FormAlert tone="bad">
          {err("form")}{" "}
          <Link href="/forgot-password" className="underline underline-offset-4">
            {t("requestNew")}
          </Link>
        </FormAlert>
      )}
      <input type="hidden" name="token" value={token} />
      <PasswordField
        id="reset-password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        label={ta("newPasswordLabel")}
        hint={ta("passwordHint")}
        error={err("password") ?? err("token")}
      />
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
