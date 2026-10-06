"use client";

import { useId, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PLAN_YEAR_COST_EUR } from "@/lib/pricing";
import {
  estimateSavings,
  OUTINGS_RANGE,
  SPEND_RANGE,
  type SavingsCategory,
} from "@/lib/savings";
import { Icon, type IconName } from "../icon";

const categories: { key: SavingsCategory; icon: IconName; tone: string }[] = [
  { key: "restaurants", icon: "fork", tone: "ci-roof" },
  { key: "bars", icon: "glass", tone: "ci-violet" },
  { key: "culture", icon: "museum", tone: "ci-sun" },
];

/** Fill percentage for the range track. */
const fill = (value: number, min: number, max: number) => `${((value - min) / (max - min)) * 100}%`;

export function SavingsCalculator() {
  const t = useTranslations("Savings");
  const locale = useLocale();
  const id = useId();
  const [outings, setOutings] = useState<number>(OUTINGS_RANGE.initial);
  const [spend, setSpend] = useState<number>(SPEND_RANGE.initial);
  const [category, setCategory] = useState<SavingsCategory>("restaurants");

  const estimate = estimateSavings(outings, spend, category);
  const money = (n: number) => formatMoney(locale, n);
  const outingsId = `${id}-outings`;
  const spendId = `${id}-spend`;

  return (
    <section id="savings" aria-labelledby="savings-title" className="sec pt-0">
      <div className="wrap">
        <div className="reveal grid overflow-hidden rounded-[34px] shadow-3 tex-paper md:grid-cols-2">
          <div className="flex flex-col gap-7 p-[clamp(24px,4vw,56px)]">
            <div>
              <span className="eyebrow">{t("eyebrow")}</span>
              <h2 id="savings-title" className="mt-3.5 text-[clamp(32px,3.6vw,52px)] font-extrabold">
                {t("title")}
              </h2>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-4 text-lg font-bold text-deep">
                <label htmlFor={outingsId}>{t("outings")}</label>
                <output htmlFor={outingsId} className="font-display text-2xl font-extrabold text-cobalt tabular-nums">
                  {outings}
                </output>
              </div>
              <input
                id={outingsId}
                type="range"
                className="range-input"
                min={OUTINGS_RANGE.min}
                max={OUTINGS_RANGE.max}
                step={OUTINGS_RANGE.step}
                value={outings}
                onChange={(e) => setOutings(Number(e.target.value))}
                style={{ "--p": fill(outings, OUTINGS_RANGE.min, OUTINGS_RANGE.max) } as CSSProperties}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-4 text-lg font-bold text-deep">
                <label htmlFor={spendId}>{t("spend")}</label>
                <output htmlFor={spendId} className="font-display text-2xl font-extrabold text-cobalt tabular-nums">
                  {money(spend)}
                </output>
              </div>
              <input
                id={spendId}
                type="range"
                className="range-input"
                min={SPEND_RANGE.min}
                max={SPEND_RANGE.max}
                step={SPEND_RANGE.step}
                value={spend}
                aria-valuetext={money(spend)}
                onChange={(e) => setSpend(Number(e.target.value))}
                style={{ "--p": fill(spend, SPEND_RANGE.min, SPEND_RANGE.max) } as CSSProperties}
              />
            </div>

            <fieldset>
              <legend className="mb-3 font-bold text-deep">{t("where")}</legend>
              <div className="flex flex-wrap gap-2.5">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={category === c.key}
                    onClick={() => setCategory(c.key)}
                    className="seg-btn"
                  >
                    <span className={`ci ${c.tone} [--s:36px]`}>
                      <Icon name={c.icon} />
                    </span>
                    {t(c.key)}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div
            className="relative flex flex-col justify-center gap-4 overflow-hidden bg-cobalt p-[clamp(24px,4vw,56px)] text-white [background-image:var(--leather),radial-gradient(120%_100%_at_100%_0%,#2D63CF,#123A8C)]"
          >
            <span
              aria-hidden="true"
              className="absolute -top-[90px] -right-[90px] size-80 rounded-full border-[40px] border-sun/14"
            />
            <span className="relative text-sm font-bold tracking-[0.12em] text-white/70 uppercase">{t("result")}</span>
            <div
              aria-live="polite"
              aria-atomic="true"
              className="relative font-display text-[clamp(72px,9vw,140px)] leading-[.85] font-extrabold tracking-[-0.04em] text-sun tabular-nums">
              {money(estimate.yearly)}
            </div>
            <dl className="relative flex flex-wrap gap-x-7 gap-y-4">
              <Stat value={money(estimate.monthly)} label={t("perMonth")} />
              <Stat value={money(MONTHLY_PLAN_YEAR_COST_EUR)} label={t("passPerYear")} />
              <Stat value={t("multiple", { n: estimate.multiple })} label={t("multipleLabel")} />
            </dl>
            <p className="relative text-[14.5px] text-white/60">{t("disclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse font-semibold text-white/75">
      <dt>{label}</dt>
      <dd className="font-display text-[30px] leading-tight font-bold text-white tabular-nums">{value}</dd>
    </div>
  );
}
