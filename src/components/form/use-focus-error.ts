"use client";

import { useEffect, type RefObject } from "react";

/** After a failed submit, move focus to the first invalid field (or the alert). */
export function useFocusFirstError(form: RefObject<HTMLFormElement | null>, errors: Record<string, string> | undefined) {
  useEffect(() => {
    if (!errors || !form.current) return;
    const target =
      form.current.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form.current.querySelector<HTMLElement>('[role="alert"]');
    if (target) {
      if (target.getAttribute("role") === "alert") target.setAttribute("tabindex", "-1");
      target.focus();
    }
  }, [errors, form]);
}
