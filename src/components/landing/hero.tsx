import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PRICE_EUR } from "@/lib/pricing";
import { Icon, type IconName } from "../icon";
import { MemberCard } from "../member-card";
import { HeroFilm } from "./hero-film";
import { RibeiraScene } from "./ribeira-scene";
import { TiltStage } from "./tilt-stage";

export function Hero({ partners }: { partners: number }) {
  const t = useTranslations("Hero");
  const tCard = useTranslations("MemberCard");
  const locale = useLocale();
  const price = formatMoney(locale, MONTHLY_PRICE_EUR);

  const trust: { icon: IconName; tone: string; title: string; detail: string }[] = [
    { icon: "check", tone: "ci-leaf", title: t("trustNoCommitment"), detail: t("trustNoCommitmentDetail") },
    { icon: "shield", tone: "", title: t("trustSecure"), detail: t("trustSecureDetail") },
    { icon: "bolt", tone: "ci-sun", title: t("trustInstant"), detail: t("trustInstantDetail") },
  ];

  return (
    <section className="relative overflow-hidden pt-4 pb-10 lg:flex lg:min-h-[min(calc(100svh-var(--nav-h)),900px)] lg:items-center lg:py-8">
      {/* Azulejo pattern fading out from the headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[.07] [background:var(--azulejo)] mask-[radial-gradient(70%_90%_at_18%_40%,#000,transparent_75%)]"
      />
      <div className="wrap relative grid w-full items-center gap-10 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
        <div className="relative z-10 flex flex-col gap-5 lg:gap-7">
          <span className="inline-flex items-center gap-2.5 self-start rounded-full border border-line bg-white py-[7px] pr-4 pl-[7px] text-[15px] font-bold text-deep shadow-1">
            <span className="grid size-[30px] place-items-center rounded-full bg-sun">
              <i className="size-[9px] animate-ping-dot rounded-full bg-ink" />
            </span>
            {t("partners", { count: partners })}
          </span>

          <h1 className="text-[clamp(40px,10.5vw,76px)] font-extrabold lg:text-[clamp(42px,4.9vw,76px)]">
            {t("title")}{" "}
            <span className="relative inline-block text-cobalt">
              {t("titleHighlight", { price })}
              <svg
                viewBox="0 0 300 30"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-[.12em] -left-[2%] h-[.36em] w-[104%] overflow-visible"
              >
                <path
                  className="hl-path animate-draw"
                  d="M4 22C70 6 180 4 296 16"
                  stroke="var(--sun)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="600"
                  strokeDashoffset="600"
                />
              </svg>
            </span>
          </h1>

          <p className="max-w-[58ch] text-lg text-mute lg:text-[clamp(18px,1.5vw,21px)]">{t("lead")}</p>

          <div className="flex flex-wrap gap-3.5">
            <Link href="/join" className="btn btn-sun pr-3!">
              {t("ctaPrimary", { price })}
              <span className="grid size-[38px] place-items-center rounded-full bg-ink text-sun">
                <Icon name="arrow" className="size-5" strokeWidth={2.4} />
              </span>
            </Link>
            <a href="#how-it-works" className="btn btn-ghost">
              {t("ctaSecondary")}
            </a>
          </div>

          <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-7">
            {trust.map((item) => (
              <li key={item.title} className="flex items-center gap-3 text-[15px] font-bold text-deep">
                <span className={`ci ${item.tone} [--s:56px]`}>
                  <Icon name={item.icon} />
                </span>
                <span>
                  {item.title}
                  <small className="block text-[13.5px] font-medium text-mute">{item.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative stage */}
        <TiltStage
          role="img"
          aria-label={t("stageLabel")}
          className="relative mx-auto h-[440px] w-full max-w-[560px] sm:h-[520px] lg:h-[min(calc(100svh-var(--nav-h)-60px),760px)] lg:min-h-[520px] lg:max-w-none"
        >
          <div className="absolute inset-y-0 right-0 left-[8%] overflow-hidden rounded-[50%_50%_40px_40px/34%_34%_40px_40px] bg-[#9CC3EC] shadow-[var(--sh-3),0_0_0_10px_rgba(255,255,255,.65),0_0_0_11px_var(--line)]">
            <RibeiraScene />
            <HeroFilm />
            <div className="absolute inset-0 bg-linear-to-b from-transparent from-55% to-deep/35" />
          </div>

          <span className="absolute top-[16%] left-[14%] z-[3] flex items-center gap-2 rounded-full border border-white/45 bg-white/22 px-3.5 py-2 text-[13px] font-extrabold tracking-[0.12em] text-white uppercase backdrop-blur-md">
            <i className="size-2 animate-blink rounded-full bg-[#FF5A47] shadow-[0_0_0_4px_rgba(255,90,71,.3)]" />
            {t("live")}
          </span>

          <Coin className="top-[10%] left-[2%] size-16 text-[28px]">€</Coin>
          <Coin className="top-[-1%] left-[40%] size-11 text-xl [animation-delay:-2.5s]">%</Coin>

          <FloatChip
            className="top-[13%] right-[-2%] hidden sm:flex"
            icon="fork"
            tone="ci-roof"
            title={t("chipOneTitle")}
            detail={t("chipOneDetail")}
          />
          <FloatChip
            className="right-[-1%] bottom-[26%] hidden [animation-delay:-3s] sm:flex"
            icon="glass"
            tone="ci-violet"
            title={t("chipTwoTitle")}
            detail={t("chipTwoDetail")}
          />

          <div className="absolute bottom-[6%] left-0 z-[4] w-[78%] perspective-[1100px] sm:left-[-4%] sm:w-[min(420px,72%)]">
            <div className="animate-float transform-3d">
              <div className="tilt-target">
                <MemberCard name={tCard("sampleName")} number="CP 0482 1937" />
              </div>
            </div>
          </div>
        </TiltStage>
      </div>
    </section>
  );
}

function Coin({ className, children }: { className: string; children: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-[3] grid animate-coin place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFF1B8,var(--sun)_45%,#C98F00)] font-display font-extrabold text-[#7A5300] shadow-[inset_0_-4px_8px_rgba(120,80,0,.35),0_14px_24px_-10px_rgba(150,100,0,.6)] ${className}`}
    >
      {children}
    </span>
  );
}

function FloatChip({
  className,
  icon,
  tone,
  title,
  detail,
}: {
  className: string;
  icon: IconName;
  tone: string;
  title: string;
  detail: string;
}) {
  return (
    <div
      className={`absolute z-[5] flex animate-float items-center gap-3 rounded-full border border-white/90 bg-white/78 py-2.5 pr-[18px] pl-2.5 text-[15px] font-bold text-deep shadow-2 backdrop-blur-md ${className}`}
    >
      <span className={`ci ${tone} [--s:46px]`}>
        <Icon name={icon} />
      </span>
      <span>
        {title}
        <b className="block text-[13px] font-semibold text-mute">{detail}</b>
      </span>
    </div>
  );
}
