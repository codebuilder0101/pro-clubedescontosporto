import type { CSSProperties, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import { OfferArt, type ArtKind } from "../art/offer-art";
import { Icon } from "../icon";
import { SectionHead } from "./section";

/**
 * Marketing teasers for the featured offers. These are static showcase
 * cards (name, area, headline discount) — never the member-only details
 * (address, conditions, how to use), which stay behind requireActiveMember().
 * Every card leads to the join flow.
 */
export function Featured() {
  const t = useTranslations("Featured");
  const locale = useLocale();

  const lock = (label: string) => (
    <span className="lock" aria-hidden="true">
      <span>
        <Icon name="lock" className="size-[18px]" strokeWidth={2.2} />
        {label}
      </span>
    </span>
  );

  return (
    <section id="offers" aria-labelledby="offers-title" className="sec pt-[clamp(40px,6vw,90px)]">
      <div className="wrap">
        <SectionHead
          id="offers-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={
            <Link href="/join" className="btn btn-blue">
              <Icon name="lock" className="size-5" strokeWidth={2.2} />
              {t("unlockAll")}
            </Link>
          }
        />

        <ul className="grid gap-[clamp(18px,2vw,28px)] sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
          {/* Ticket with notches */}
          <li className="reveal sm:col-span-2 xl:col-span-1 xl:row-span-2">
            <TeaserLink label={`${t("tascaName")} · ${t("tascaTag")} · ${t("membersOnly")}`} className="ticket locked h-full"
              // Notches sit exactly on the tear line above the 128px body.
              style={{ "--notch": "calc(100% - 129px)" } as CSSProperties}
            >
              <div className="art min-h-[260px] flex-1 xl:min-h-[300px]">
                <OfferArt kind="tasca" />
                <span className="tag">{t("tascaTag")}</span>
                {lock(t("membersOnly"))}
              </div>
              <div className="tear" />
              <div className="flex h-[128px] items-center justify-between gap-4 px-7">
                <div className="min-w-0">
                  <h3 className="truncate text-[clamp(24px,2.4vw,34px)] font-bold">{t("tascaName")}</h3>
                  <Meta icon="pin">{t("tascaMeta")}</Meta>
                </div>
                <span className="ci ci-roof [--s:64px] sm:[--s:72px]">
                  <Icon name="fork" />
                </span>
              </div>
            </TeaserLink>
          </li>

          <Polaroid
            art="bar"
            rot="-2.5deg"
            name={t("barName")}
            meta={t("barMeta")}
            tag={t("barTag")}
            label={t("members")}
            fullLabel={`${t("barName")} · ${t("barTag")} · ${t("membersOnly")}`}
            lock={lock}
          />

          {/* Petal */}
          <li className="reveal">
            <TeaserLink label={`${t("concertsName")} · ${t("concertsTag")}`} className="petal h-full min-h-[280px]">
              <span className="ci [--c1:#2C62CF] [--s:64px] sm:[--s:72px]">
                <Icon name="ticket" />
              </span>
              <div>
                <div className="font-display text-[clamp(64px,7vw,110px)] leading-[.8] font-extrabold tracking-[-0.04em] text-deep">
                  {t("concertsTag")}
                </div>
                <h3 className="mt-2 text-[clamp(26px,2.6vw,38px)] font-bold text-ink">{t("concertsName")}</h3>
              </div>
              <Meta icon="cal" className="text-ink">
                {t("concertsMeta")}
              </Meta>
            </TeaserLink>
          </li>

          {/* Pebble */}
          <li className="reveal grid place-items-center">
            <TeaserLink label={`${t("azulejoName")} · ${t("azulejoMeta")}`} className="pebble w-full max-w-[420px]">
              <div className="art">
                <OfferArt kind="cultura" />
              </div>
              <h3 className="text-[22px] font-bold">{t("azulejoName")}</h3>
              <Meta icon="pin">{t("azulejoMeta")}</Meta>
            </TeaserLink>
          </li>

          <Polaroid
            art="surf"
            rot="2deg"
            tape="rgba(23,71,166,.25)"
            name={t("surfName")}
            meta={t("surfMeta")}
            tag={t("surfTag", { amount: formatMoney(locale, 10) })}
            label={t("members")}
            fullLabel={`${t("surfName")} · ${t("surfTag", { amount: formatMoney(locale, 10) })} · ${t("membersOnly")}`}
            lock={lock}
          />
        </ul>
      </div>
    </section>
  );
}

function TeaserLink({
  label,
  className,
  style,
  children,
}: {
  label: string;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link href="/join" aria-label={label} className={className} style={style}>
      {children}
    </Link>
  );
}

function Meta({ icon, className = "", children }: { icon: "pin" | "cal"; className?: string; children: ReactNode }) {
  return (
    <div className={`meta ${className}`}>
      <Icon name={icon} />
      <span>{children}</span>
    </div>
  );
}

function Polaroid({
  art,
  rot,
  tape,
  name,
  meta,
  tag,
  label,
  fullLabel,
  lock,
}: {
  art: ArtKind;
  rot: string;
  tape?: string;
  name: string;
  meta: string;
  tag: string;
  label: string;
  fullLabel: string;
  lock: (label: string) => ReactNode;
}) {
  return (
    <li className="reveal px-2 pt-3">
      <TeaserLink label={fullLabel} className="polaroid locked" style={{ "--rot": rot } as CSSProperties}>
        <span className="tape" style={tape ? ({ "--tape": tape } as CSSProperties) : undefined} />
        <div className="art">
          <OfferArt kind={art} />
          <span className="tag">{tag}</span>
          {lock(label)}
        </div>
        <div>
          <h3 className="text-[22px] font-bold">{name}</h3>
          <Meta icon="pin">{meta}</Meta>
        </div>
      </TeaserLink>
    </li>
  );
}
