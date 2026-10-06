import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import { MONTHLY_PRICE_EUR } from "@/lib/pricing";
import { Icon, type IconName } from "../icon";
import { SectionHead } from "./section";

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const locale = useLocale();
  const price = formatMoney(locale, MONTHLY_PRICE_EUR);

  const steps: { icon: IconName; tone: string; title: string; text: string }[] = [
    { icon: "euro", tone: "ci-sun", title: t("step1Title"), text: t("step1Text", { price }) },
    { icon: "search", tone: "ci-sky", title: t("step2Title"), text: t("step2Text") },
    { icon: "qr", tone: "ci-leaf", title: t("step3Title"), text: t("step3Text") },
  ];

  const notes: { icon: IconName; tone: string; title: string; detail: string }[] = [
    { icon: "clock", tone: "ci-sun", title: t("noteClock"), detail: t("noteClockDetail") },
    { icon: "lock", tone: "", title: t("noteServer"), detail: t("noteServerDetail") },
  ];

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="sec how">
      <div className="wrap relative">
        <SectionHead
          id="how-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={<p className="lead">{t("lead")}</p>}
        />

        <div className="relative">
          <svg
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[8%] top-14 hidden h-[120px] w-[84%] md:block"
          >
            <path
              d="M60 40C220 140 380 -20 500 60S800 150 940 30"
              fill="none"
              stroke="rgba(255,197,49,.55)"
              strokeWidth="3"
              strokeDasharray="2 12"
              strokeLinecap="round"
            />
          </svg>
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-[clamp(20px,3vw,48px)]">
            {steps.map((step, i) => (
              <li key={step.title} className={`reveal relative flex flex-col gap-4 px-1.5 ${i === 1 ? "md:mt-[70px]" : ""}`}>
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 left-[clamp(80px,7.2vw,112px)] z-[2] grid size-11 place-items-center rounded-full bg-white font-display text-xl font-extrabold text-deep shadow-2"
                >
                  {i + 1}
                </span>
                <span className={`ci step-ci ${step.tone}`}>
                  <Icon name={step.icon} />
                </span>
                <h3 className="text-[clamp(22px,2vw,28px)] leading-[1.15] font-bold">{step.title}</h3>
                <p className="max-w-[34ch] text-white/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <ul className="reveal mt-[clamp(44px,6vw,90px)] flex flex-wrap items-end justify-center gap-4">
          {notes.map((note) => (
            <li key={note.title} className="glass-note">
              <span className={`ci ${note.tone} [--s:60px] sm:[--s:72px]`}>
                <Icon name={note.icon} />
              </span>
              <span>
                {note.title}
                <small className="block text-[15px] font-medium text-white/65">{note.detail}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
