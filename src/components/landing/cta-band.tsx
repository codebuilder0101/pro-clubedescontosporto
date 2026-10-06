import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PRICE_EUR } from "@/lib/pricing";
import { Icon } from "../icon";

export function CtaBand() {
  const t = useTranslations("CtaBand");
  const tHero = useTranslations("Hero");
  const locale = useLocale();

  return (
    <section aria-labelledby="cta-title" className="cta-band">
      <div className="wrap relative grid items-center gap-8 py-[clamp(56px,8vw,110px)] md:grid-cols-[1.3fr_1fr] md:gap-10">
        <div className="flex flex-col gap-5">
          <h2 id="cta-title" className="h2 text-ink">
            {t("title")}
          </h2>
          <p className="text-lg font-semibold text-ink/80 sm:text-xl">{t("text")}</p>
        </div>
        <div className="flex md:justify-end">
          <Link href="/join" className="btn btn-blue pr-3! whitespace-normal sm:min-h-[70px] sm:pl-9 sm:text-xl">
            {tHero("ctaPrimary", { price: formatMoney(locale, MONTHLY_PRICE_EUR) })}
            <span className="btn-arrow bg-sun text-ink">
              <Icon name="arrow" className="size-5" strokeWidth={2.4} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
