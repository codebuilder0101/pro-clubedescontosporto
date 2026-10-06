"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ZONES, type ZoneId } from "@/lib/landing-data";
import { Icon } from "../icon";

const pinKey = {
  ribeira: "pinRibeira",
  boavista: "pinBoavista",
  foz: "pinFoz",
  gaia: "pinGaia",
} as const satisfies Record<ZoneId, string>;

/** Zone list + illustrated map; choosing a zone highlights its pin. */
export function ZonesMap() {
  const t = useTranslations("Zones");
  const [active, setActive] = useState<ZoneId>("ribeira");

  return (
    <section id="zones" aria-labelledby="zones-title" className="sec tex-paper">
      <div className="wrap grid items-center gap-[clamp(32px,4vw,60px)] md:grid-cols-[1fr_1.3fr]">
        <div className="reveal flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">{t("eyebrow")}</span>
            <h2 id="zones-title" className="h2">
              {t("title")}
            </h2>
          </div>
          <ul aria-label={t("listLabel")} className="flex flex-col gap-3 pr-2">
            {ZONES.map((z) => (
              <li key={z.id}>
                <button
                  type="button"
                  aria-pressed={active === z.id}
                  onClick={() => setActive(z.id)}
                  onMouseEnter={() => setActive(z.id)}
                  onFocus={() => setActive(z.id)}
                  className="zone"
                >
                  <span className={`ci ${z.tone} [--s:52px] sm:[--s:62px]`}>
                    <Icon name="pin" />
                  </span>
                  <b className="font-display text-lg text-deep sm:text-[22px]">{t(z.id)}</b>
                  <span className="ml-auto text-base font-extrabold text-cobalt tabular-nums">
                    <span aria-hidden="true">{z.count}</span>
                    <span className="sr-only">{t("count", { count: z.count })}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal map-blob" role="img" aria-label={t("mapLabel")}>
          <ZoneMapSvg active={active} labels={Object.fromEntries(ZONES.map((z) => [z.id, t(pinKey[z.id])]))} />
        </div>
      </div>
    </section>
  );
}

function ZoneMapSvg({ active, labels }: { active: ZoneId; labels: Record<string, string> }) {
  const roads = [
    ...Array.from({ length: 9 }, (_, i) => (
      <path
        key={`v${i}`}
        d={`M${-20 + i * 55} 0Q${40 + i * 50} 170 ${10 + i * 48} 400`}
        stroke="#fff"
        strokeWidth={i % 3 ? 3 : 7}
        fill="none"
        opacity=".9"
      />
    )),
    ...Array.from({ length: 7 }, (_, i) => (
      <path
        key={`h${i}`}
        d={`M0 ${30 + i * 55}Q200 ${10 + i * 60} 420 ${40 + i * 52}`}
        stroke="#fff"
        strokeWidth={i % 2 ? 3 : 6}
        fill="none"
        opacity=".9"
      />
    )),
  ];

  return (
    <svg viewBox="0 0 400 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full">
      <rect width="400" height="400" fill="#E8EEF7" />
      <path d="M0 0h70q-20 120 10 260t-20 140H0z" fill="#A9CBF0" />
      <path d="M0 0h52q-16 120 8 260t-18 140H0z" fill="#8DB9EA" />
      {roads}
      <path d="M60 250Q160 225 240 250T420 230" stroke="#7FB0EA" strokeWidth="34" fill="none" strokeLinecap="round" />
      <path d="M60 250Q160 225 240 250T420 230" stroke="#9CC4F0" strokeWidth="20" fill="none" strokeLinecap="round" />
      <circle cx="160" cy="80" r="40" fill="#CDEBD9" opacity=".9" />
      <circle cx="330" cy="120" r="30" fill="#CDEBD9" opacity=".9" />
      <rect x="300" y="300" width="70" height="40" rx="18" fill="#CDEBD9" />
      <path d="M232 236q16-30 32 0" stroke="#0F2D6B" strokeWidth="4" fill="none" />
      {/* Inactive pins first so the active one always paints on top. */}
      {[...ZONES]
        .sort((a, b) => Number(a.id === active) - Number(b.id === active))
        .map((z) => {
          const { x, y } = z.pin;
          const label = labels[z.id];
          const on = z.id === active;
          const delay = ZONES.findIndex((o) => o.id === z.id);
          return (
            <g key={z.id} style={{ opacity: on ? 1 : 0.35, transition: "opacity .3s" }}>
              <circle
                className="map-pulse"
                cx={x}
                cy={y}
                r="14"
                fill={z.color}
                opacity=".5"
                style={{ animationDelay: `${delay * 0.5}s` }}
              />
              <g className="map-pin" style={{ animationDelay: `${delay * 0.3}s` }}>
                <path
                  d={`M${x} ${y}c-14-16-22-26-22-38a22 22 0 0 1 44 0c0 12-8 22-22 38z`}
                  fill={z.color}
                  stroke="#fff"
                  strokeWidth="3"
                />
                <circle cx={x} cy={y - 38} r="8" fill="#fff" />
              </g>
              <rect x={x + 16} y={y - 30} width={label.length * 9 + 26} height="30" rx="15" fill="#fff" stroke="#DCE5F6" />
              <text
                x={x + 29}
                y={y - 10}
                fontWeight="800"
                fontSize="15"
                fill="#0F2D6B"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {label}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
