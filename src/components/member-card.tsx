import { useTranslations } from "next-intl";
import { Logo } from "./logo";

/**
 * Leather member card. Presentational only: the landing page shows a sample,
 * the member area will pass real data once auth exists.
 */
export function MemberCard({
  name,
  number,
  active = true,
  className = "",
}: {
  name: string;
  number: string;
  active?: boolean;
  className?: string;
}) {
  const t = useTranslations("MemberCard");

  return (
    <div className={`mcard tex-leather ${className}`}>
      <span aria-hidden="true" className="mcard-shine" />
      <div className="relative z-10 flex items-center justify-between">
        <Logo size="sm" tone="light" />
        <span className="h-[30px] w-10 rounded-lg bg-linear-135 from-[#FFE08A] via-sun-d to-[#FFD45C] shadow-[inset_0_0_0_1px_rgba(120,80,0,.35)] sm:h-[34px] sm:w-11" />
      </div>
      <div className="relative z-10 mt-auto">
        <small className="text-[11px] font-bold tracking-[0.18em] uppercase opacity-70">{t("member")}</small>
        <b className="block font-display text-[22px] tracking-[-0.01em] sm:text-[26px]">{name}</b>
      </div>
      <div className="relative z-10 mt-2 flex items-end justify-between font-mono text-[13px] tracking-[0.08em] sm:text-sm">
        <span>{number}</span>
        {active && (
          <span className="flex items-center gap-1.5 rounded-full bg-[rgba(61,220,142,.18)] px-2.5 py-1 font-sans text-xs font-extrabold tracking-[0.1em] text-[#7CF0B8] uppercase">
            <i className="size-[7px] rounded-full bg-[#3DDC8E]" />
            {t("active")}
          </span>
        )}
      </div>
    </div>
  );
}
