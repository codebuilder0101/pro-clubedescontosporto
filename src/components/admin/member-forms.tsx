"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { grantAccess } from "@/lib/actions/admin/members";
import { updatePartnerRequest } from "@/lib/actions/admin/partner-requests";
import { initialFormState } from "@/lib/actions/form-state";
import { FormAlert } from "../form/field";
import { SaveButton, Select, TextArea, TextInput, useAdminError } from "./fields";

export function GrantForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(grantAccess, initialFormState);
  const t = useTranslations("Admin.members");
  const err = useAdminError(state.errors);
  return (
    <form action={action} noValidate className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <TextInput id="g-days" name="days" type="number" min={1} max={3660} label={t("days")} defaultValue={30} error={err("days")} />
      <TextInput id="g-note" name="note" label={t("note")} maxLength={200} placeholder={t("notePlaceholder")} error={err("note")} />
      <SaveButton pending={pending}>{t("grant")}</SaveButton>
      {state.ok && (
        <div className="sm:col-span-3">
          <FormAlert tone="ok">{t("granted")}</FormAlert>
        </div>
      )}
    </form>
  );
}

export function PartnerRequestForm({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [state, action, pending] = useActionState(updatePartnerRequest, initialFormState);
  const t = useTranslations("Admin.requests");
  const ta = useTranslations("Admin");
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
      <input type="hidden" name="id" value={id} />
      <Select
        id={`pr-status-${id}`}
        name="status"
        label={t("status")}
        defaultValue={status}
        options={(["NEW", "CONTACTED", "ACCEPTED", "REJECTED"] as const).map((s) => ({ value: s, label: ta(`status.${s}`) }))}
      />
      <TextArea id={`pr-notes-${id}`} name="notes" label={t("notes")} rows={2} maxLength={2000} defaultValue={notes} />
      <SaveButton pending={pending}>{ta("save")}</SaveButton>
      {state.ok && (
        <div className="sm:col-span-3">
          <FormAlert tone="ok">{ta("saved")}</FormAlert>
        </div>
      )}
    </form>
  );
}
