import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PRICE_EUR, YEARLY_PRICE_EUR, yearlyPlanMonthsSaved } from "@/lib/pricing";
import { Icon } from "../icon";
import { SectionHead } from "./section";

export function Plans() {
  const t = useTranslations("Plans");
  const locale = useLocale();
  const sealId = `seal${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const year = new Date().getFullYear();

  return (
    <section id="plans" aria-labelledby="plans-title" className="sec">
      <div className="wrap">
        <SectionHead id="plans-title" eyebrow={t("eyebrow")} title={t("title")} center />

        <div className="mx-auto grid max-w-[1080px] items-center gap-[clamp(28px,3vw,40px)] md:grid-cols-[1fr_1.1fr]">
          {/* Monthly: paper with notches */}
          <article aria-labelledby="plan-monthly" className="plan plan-paper reveal">
            <div className="flex items-center justify-between">
              <h3 id="plan-monthly" className="text-[clamp(22px,2vw,28px)] font-bold">
                {t("monthly")}
              </h3>
              <span className="ci [--s:64px] sm:[--s:72px]">
                <Icon name="cal" />
              </span>
            </div>
            <p className="plan-price">
              {formatMoney(locale, MONTHLY_PRICE_EUR)}
              <small>{t("perMonth")}</small>
            </p>
            <Features items={[t("monthlyFeature1"), t("monthlyFeature2"), t("monthlyFeature3")]} tone="ci-leaf" />
            <Link href={{ pathname: "/join", query: { plan: "monthly" } }} className="btn btn-ghost border-cobalt!">
              {t("monthlyCta", { price: formatMoney(locale, MONTHLY_PRICE_EUR) })}
            </Link>
          </article>

          {/* Yearly: leather, highlighted */}
          <article aria-labelledby="plan-yearly" className="plan plan-leather reveal mt-4 md:mt-0">
            <span className="ribbon">{t("ribbon", { months: yearlyPlanMonthsSaved() })}</span>
            <div className="flex items-center justify-between">
              <h3 id="plan-yearly" className="text-[clamp(22px,2vw,28px)] font-bold">
                {t("yearly")}
              </h3>
              <span className="ci ci-sun [--s:64px] sm:[--s:72px]">
                <Icon name="star" />
              </span>
            </div>
            <p className="plan-price">
              {formatMoney(locale, YEARLY_PRICE_EUR)}
              <small>{t("perYear")}</small>
            </p>
            <Features items={[t("yearlyFeature1"), t("yearlyFeature2"), t("yearlyFeature3")]} tone="ci-sun" />
            <Link href={{ pathname: "/join", query: { plan: "yearly" } }} className="btn btn-sun self-start pr-3!">
              {t("yearlyCta")}
              <span className="btn-arrow bg-ink text-sun">
                <Icon name="arrow" className="size-5" strokeWidth={2.4} />
              </span>
            </Link>
            <svg viewBox="0 0 120 120" aria-hidden="true" className="seal hidden xl:block">
              <defs>
                <path id={sealId} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
              </defs>
              <text
                fontWeight="800"
                fontSize="11"
                letterSpacing="3.2"
                fill="rgba(255,197,49,.85)"
                style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}
              >
                <textPath href={`#${sealId}`} textLength="272" lengthAdjust="spacing">
                  {t("seal", { year })}
                </textPath>
              </text>
            </svg>
          </article>
        </div>
      </div>
    </section>
  );
}

function Features({ items, tone }: { items: string[]; tone: string }) {
  return (
    <ul className="flex flex-col gap-3.5 font-semibold">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3.5">
          <span className={`ci ${tone} [--s:34px]`}>
            <Icon name="check" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
