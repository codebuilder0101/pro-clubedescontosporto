import { useTranslations } from "next-intl";
import { Icon, type IconName } from "../icon";
import { SectionHead } from "./section";

const items: { n: 1 | 2 | 3 | 4; icon: IconName; tone: string }[] = [
  { n: 1, icon: "card", tone: "ci-sun" },
  { n: 2, icon: "euro", tone: "" },
  { n: 3, icon: "wallet", tone: "ci-leaf" },
  { n: 4, icon: "store", tone: "ci-roof" },
];

/** Native <details> accordion: works without JS and is keyboard accessible. */
export function Faq() {
  const t = useTranslations("Faq");

  return (
    <section id="faq" aria-labelledby="faq-title" className="sec pt-0">
      <div className="wrap">
        <SectionHead id="faq-title" eyebrow={t("eyebrow")} title={t("title")} center />
        <div className="mx-auto flex max-w-[940px] flex-col gap-3.5">
          {items.map(({ n, icon, tone }) => (
            <details key={n} className="qa reveal" open={n === 1}>
              <summary>
                <span className={`ci ${tone} [--s:48px] sm:[--s:56px]`}>
                  <Icon name={icon} />
                </span>
                <span className="min-w-0">{t(`q${n}`)}</span>
                <span className="tg" aria-hidden="true">
                  <Icon name="plus" className="size-5" strokeWidth={2.4} />
                </span>
              </summary>
              <p className="max-w-[72ch] px-5 pb-6 text-mute sm:pr-8 sm:pl-[88px]">{t(`a${n}`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
