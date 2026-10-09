"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useTranslations } from "next-intl";

/** Error code → translated message (Admin.errors.*). */
export function useAdminError(errors: Record<string, string> | undefined) {
  const t = useTranslations("Admin.errors");
  return (key: string) => {
    const code = errors?.[key];
    if (!code) return undefined;
    // Unknown codes (e.g. a library's default message) get a generic text.
    return t.has(code) ? t(code) : t("invalid");
  };
}

type Common = { label: string; error?: string; hint?: ReactNode; id: string; className?: string };

function Wrap({ label, error, hint, id, className = "", children }: Common & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="a-label">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="a-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error !ml-0">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextInput({ label, error, hint, id, className, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap {...{ label, error, hint, id, className }}>
      <input id={id} className="a-input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props} />
    </Wrap>
  );
}

export function TextArea({ label, error, hint, id, className, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap {...{ label, error, hint, id, className }}>
      <textarea id={id} className="a-input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props} />
    </Wrap>
  );
}

export function Select({
  label,
  error,
  hint,
  id,
  className,
  options,
  placeholder,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Wrap {...{ label, error, hint, id, className }}>
      <select id={id} className="a-input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function SaveButton({ pending, children, className = "" }: { pending: boolean; children: ReactNode; className?: string }) {
  const t = useTranslations("Admin");
  return (
    <button type="submit" disabled={pending} className={`btn btn-sun disabled:opacity-70 ${className}`}>
      {pending ? t("saving") : children}
    </button>
  );
}
