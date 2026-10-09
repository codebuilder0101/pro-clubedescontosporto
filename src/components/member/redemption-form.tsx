"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { recordRedemption, type RedemptionState } from "@/lib/actions/member";
import { formatMoney } from "@/lib/format";
import { FormAlert } from "../form/field";
import { Icon } from "../icon";

/** "I used this discount": optional bill amount, then the estimated saving. */
export function RedemptionForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<RedemptionState, FormData>(recordRedemption, {});
  const t = useTranslations("Usage");
  const locale = useLocale();

  return (
    <section aria-labelledby="usage-title" className="auth-panel flex flex-col gap-4 !p-5 sm:!p-6">
      <div className="flex items-center gap-4">
        <span className="ci ci-leaf [--s:52px]">
          <Icon name="check" />
        </span>
        <div>
          <h2 id="usage-title" className="text-[22px] font-bold">
            {t("title")}
          </h2>
          <p className="text-[15px] text-mute">{t("lead")}</p>
        </div>
      </div>
      {state.status === "ok" ? (
        <FormAlert tone="ok">
          {state.saved ? t("savedAmount", { amount: formatMoney(locale, state.saved) }) : t("saved")}
        </FormAlert>
      ) : (
        <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="slug" value={slug} />
          <label className="field flex-1">
            <span className="field-icon" aria-hidden="true">
              <Icon name="euro" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="field-label">{t("bill")}</span>
              <input name="bill" inputMode="decimal" autoComplete="off" placeholder={t("billPlaceholder")} pattern="[0-9]+([.,][0-9]{1,2})?" />
            </span>
          </label>
          <button type="submit" disabled={pending} className="btn btn-blue disabled:opacity-70">
            {pending ? t("pending") : t("submit")}
          </button>
        </form>
      )}
      {state.status === "cooldown" && <FormAlert tone="info">{t("cooldown")}</FormAlert>}
      {state.status === "invalid" && <FormAlert tone="bad">{t("invalid")}</FormAlert>}
    </section>
  );
}
