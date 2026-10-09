"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { localeLabels, locales, type Locale } from "@/i18n/routing";

/**
 * One tab per language. All panels stay in the DOM (hidden ones too), so the
 * form submits every language at once. The dot turns green when the
 * language's required fields are filled.
 */
export function LocaleTabs({
  required,
  initialComplete,
  errorLocales = [],
  children,
}: {
  /** Field names (inside each panel) that make a language "complete". */
  required: string[];
  initialComplete: Locale[];
  /** Languages with a validation error: shown first. */
  errorLocales?: Locale[];
  children: (locale: Locale) => ReactNode;
}) {
  const t = useTranslations("Admin");
  const tl = useTranslations("LocaleSwitcher");
  const id = useId();
  const [active, setActive] = useState<Locale>(errorLocales[0] ?? "pt-PT");
  const [complete, setComplete] = useState<Set<Locale>>(new Set(initialComplete));
  const panels = useRef<Partial<Record<Locale, HTMLDivElement | null>>>({});

  const recheck = useCallback(
    (l: Locale) => {
      const panel = panels.current[l];
      if (!panel) return;
      const filled = required.every((name) => {
        const el = panel.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="tr.${l}.${name}"]`);
        return Boolean(el?.value.trim());
      });
      setComplete((prev) => {
        const next = new Set(prev);
        if (filled) next.add(l);
        else next.delete(l);
        return next;
      });
    },
    [required],
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={t("languages")} className="tabs-list">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            id={`${id}-tab-${l}`}
            aria-selected={active === l}
            aria-controls={`${id}-panel-${l}`}
            onClick={() => setActive(l)}
          >
            <span className="tab-dot" data-complete={complete.has(l)} aria-hidden="true" />
            {localeLabels[l]}
            <span className="sr-only">
              {tl(l)}: {complete.has(l) ? t("complete") : t("incomplete")}
            </span>
          </button>
        ))}
      </div>
      {locales.map((l) => (
        <div
          key={l}
          ref={(el) => {
            panels.current[l] = el;
          }}
          role="tabpanel"
          id={`${id}-panel-${l}`}
          aria-labelledby={`${id}-tab-${l}`}
          hidden={active !== l}
          onInput={() => recheck(l)}
          className="flex flex-col gap-4"
        >
          <p className="text-[14px] font-semibold text-mute">{l === "pt-PT" ? t("ptRequired") : t("fallbackHint")}</p>
          {children(l)}
        </div>
      ))}
    </div>
  );
}
