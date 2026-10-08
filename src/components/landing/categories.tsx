import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { CategorySlug } from "@/lib/landing-data";
import { Icon, type IconName } from "../icon";
import { SectionHead } from "./section";

const items: { key: CategorySlug | "all"; icon: IconName; tone: string; tint: string }[] = [
  { key: "restaurants", icon: "fork", tone: "ci-roof", tint: "#FAD9C9" },
  { key: "bars", icon: "glass", tone: "ci-violet", tint: "#E2D8F7" },
  { key: "events", icon: "ticket", tone: "ci-sky", tint: "#D3E4FA" },
  { key: "culture", icon: "museum", tone: "ci-sun", tint: "#FFEBB3" },
  { key: "leisure", icon: "wave", tone: "ci-leaf", tint: "#CDEFE0" },
  { key: "all", icon: "grid", tone: "ci-slate", tint: "#DCE3EE" },
];

export function Categories({ counts, total }: { counts: Record<CategorySlug, number>; total: number }) {
  const t = useTranslations("Categories");

  return (
    <section id="categories" aria-labelledby="categories-title" className="sec tex-grain-tile">
      <div className="wrap">
        <SectionHead
          id="categories-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={<p className="lead">{t("lead")}</p>}
        />
        <ul className="reveal grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6 xl:gap-[22px]">
          {items.map((item) => {
            const count = item.key === "all" ? total : counts[item.key];
            return (
              <li key={item.key} className="cat-arch" style={{ "--tint": item.tint } as CSSProperties}>
                <span className={`ci ${item.tone}`}>
                  <Icon name={item.icon} />
                </span>
                <a href="#offers" className="static flex flex-col items-center gap-1 after:absolute after:inset-0 after:z-10 focus-visible:outline-none">
                  <b className="relative font-display text-xl text-deep sm:text-[22px]">{t(item.key)}</b>
                  <span className="relative text-[15px] font-semibold text-mute">{t("count", { count })}</span>
                </a>
                <span className="go" aria-hidden="true">
                  <Icon name="arrow" className="size-[18px]" strokeWidth={2.2} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
