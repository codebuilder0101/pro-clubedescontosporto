import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "../icon";

/**
 * Labelled input in the prototype's style: round icon, small uppercase label,
 * bold value. Errors are linked with aria-describedby.
 */
export function Field({
  label,
  icon,
  error,
  hint,
  trailing,
  id,
  ...input
}: {
  label: string;
  icon: IconName;
  error?: string;
  hint?: string;
  /** Extra control at the end of the field (e.g. show password). */
  trailing?: ReactNode;
  id: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <div className="field" data-invalid={error ? "true" : undefined}>
        <span className="field-icon" aria-hidden="true">
          <Icon name={icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <label htmlFor={id} className="field-label">
            {label}
          </label>
          <input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
        </span>
        {trailing}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 ml-3.5 text-[15px] text-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ tone, children }: { tone: "bad" | "ok" | "info"; children: ReactNode }) {
  const icon: IconName = tone === "ok" ? "check" : "info";
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`form-alert form-alert-${tone}`}>
      <Icon name={icon} strokeWidth={2.4} />
      <span>{children}</span>
    </div>
  );
}
