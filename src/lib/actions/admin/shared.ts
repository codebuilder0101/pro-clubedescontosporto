import "server-only";
import { revalidatePath } from "next/cache";
import type * as z from "zod";
import type { FormState } from "../form-state";

/** First error per field, keyed by its full path ("tr.pt-PT.title", "slug"…). */
export function adminErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".").replace(/^translations\.([^.]+)\./, "tr.$1.");
    out[path || "form"] ??= issue.message;
  }
  return out;
}

export function failed(errors: Record<string, string>): FormState {
  return { errors };
}

/** Public pages that show counts (landing, partners) pick up content changes. */
export function refreshPublicPages() {
  revalidatePath("/[locale]/(site)", "layout");
}

export const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
