"use client";

import { useActionState, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { startCheckout } from "@/lib/actions/billing";
import { initialFormState } from "@/lib/actions/form-state";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR, yearlyPlanMonthsSaved } from "@/lib/pricing";
import { FormAlert } from "../form/field";
import { SubmitButton } from "../form/submit-button";
import { useFocusFirstError } from "../form/use-focus-error";
import { Icon } from "../icon";

type Plan = "MONTHLY" | "YEARLY";

/** Plan choice (radio cards) that sends the member to Stripe Checkout. */
export function PlanForm({ initialPlan }: { initialPlan: Plan }) {
  const [state, action] = useActionState(startCheckout, initialFormState);
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const t = useTranslations("Join");
  const ta = useTranslations("Auth");
  const locale = useLocale();
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(form, state.errors);
  const err = (key: string) => (state.errors?.[key] ? ta(`errors.${state.errors[key]}`) : undefined);

  const options: { value: Plan; name: string; price: number; per: string; note: string; icon: "check" | "star" }[] = [
    { value: "MONTHLY", name: t("monthly"), price: MONTHLY_PRICE_EUR, per: t("perMonth"), note: t("monthlyNote"), icon: "check" },
    { value: "YEARLY", name: t("yearly"), price: YEARLY_PRICE_EUR, per: t("perYear"), note: t("yearlyNote", { months: yearlyPlanMonthsSaved() }), icon: "star" },
  ];
  const total = plan === "YEARLY" ? YEARLY_PRICE_EUR : MONTHLY_PRICE_EUR;

  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      {(state.errors?.form || state.errors?.plan) && <FormAlert tone="bad">{err("form") ?? err("plan")}</FormAlert>}
      <fieldset>
        <legend className="sr-only">{t("plansLabel")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((o) => (
            <label key={o.value} className="plan-pick">
              <input type="radio" name="plan" value={o.value} checked={plan === o.value} onChange={() => setPlan(o.value)} />
              <span className="font-display text-2xl font-bold text-deep">{o.name}</span>
              <span className="price">
                {/* Whole euros render without decimals ("1 €", "€10"). */}
                {formatMoney(locale, o.price)}
                <small>{o.per}</small>
              </span>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-mute">
                <Icon name={o.icon} className="size-4" strokeWidth={2.4} />
                {o.note}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between rounded-3xl bg-tile px-6 py-5">
        <span className="font-bold text-deep">
          {t("totalToday")}
          <span className="block text-[14px] font-semibold text-mute">{t("methods")}</span>
        </span>
        <b className="font-display text-[32px] font-extrabold text-deep tabular-nums">
          {new Intl.NumberFormat(locale === "en" ? "en-GB" : locale, { style: "currency", currency: "EUR" }).format(total)}
        </b>
      </div>

      <SubmitButton>{t("pay")}</SubmitButton>
    </form>
  );
}
