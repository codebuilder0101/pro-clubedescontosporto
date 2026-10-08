"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Icon } from "../icon";

/** Primary submit button; disabled with a pending label while the action runs. */
export function SubmitButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations("Auth");
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`btn btn-sun w-full pr-3! disabled:opacity-70 ${className}`}>
      <span className="flex-1 text-center">{pending ? t("pending") : children}</span>
      <span className="btn-arrow bg-ink text-sun" aria-hidden="true">
        <Icon name="arrow" className="size-5" strokeWidth={2.4} />
      </span>
    </button>
  );
}
