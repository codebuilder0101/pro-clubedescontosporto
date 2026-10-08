"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "../icon";
import { Field } from "./field";

/** Password input with a show/hide toggle. */
export function PasswordField(
  props: { label: string; error?: string; hint?: string; id: string } & InputHTMLAttributes<HTMLInputElement>,
) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      icon="key"
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          aria-controls={props.id}
          className="grid size-11 flex-none place-items-center rounded-full text-mute hover:bg-linen hover:text-deep"
        >
          <Icon name={visible ? "eyeOff" : "eye"} className="size-5" />
        </button>
      }
    />
  );
}
