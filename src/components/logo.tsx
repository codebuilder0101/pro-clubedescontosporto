import { useId } from "react";
import { useTranslations } from "next-intl";

/** Club logo: spinning azulejo rosette with a % coin, plus the wordmark. */
export function Logo({
  size = "md",
  tone = "dark",
  hideTaglineOnMobile = false,
}: {
  size?: "sm" | "md";
  tone?: "dark" | "light";
  hideTaglineOnMobile?: boolean;
}) {
  const t = useTranslations("Brand");
  const gradientId = useId();
  const mark = size === "sm" ? "size-10" : "size-12 lg:size-[58px]";

  return (
    <span className="flex flex-none items-center gap-3 whitespace-nowrap font-display lg:gap-3.5">
      <svg viewBox="0 0 64 64" aria-hidden="true" className={`${mark} flex-none overflow-visible`}>
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="28%" r="80%">
            <stop offset="0" stopColor="#3F76DE" />
            <stop offset="1" stopColor="#0F2D6B" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="31" fill={`url(#${gradientId})`} />
        <circle cx="32" cy="32" r="30.2" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
        <g
          className="animate-spin-slow"
          style={{ transformOrigin: "32px 32px" }}
          fill="none"
          stroke="#A9C7F7"
          strokeWidth="1.7"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M32 6q5 7 0 13q-5-6 0-13" transform={`rotate(${i * 45} 32 32)`} />
          ))}
          <circle cx="32" cy="32" r="24.5" strokeDasharray="1.5 3.5" />
        </g>
        <circle cx="32" cy="32" r="14.5" fill="#FFC531" />
        <circle cx="32" cy="32" r="14.5" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" />
        <circle cx="27.2" cy="27" r="3.1" fill="#0F2D6B" />
        <circle cx="36.8" cy="37" r="3.1" fill="#0F2D6B" />
        <path d="M37.6 25.4 26.4 38.6" stroke="#0F2D6B" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="leading-[.95]">
        <b
          className={`block font-extrabold tracking-[-0.02em] ${
            size === "sm" ? "text-lg" : "text-[22px] lg:text-2xl"
          } ${tone === "light" ? "text-white" : "text-deep"}`}
        >
          {t("wordmark")}
        </b>
        <small
          className={`mt-1 font-sans font-bold uppercase tracking-[0.2em] ${
            size === "sm" ? "text-[10px]" : "text-[12.5px]"
          } ${tone === "light" ? "text-sun" : "text-cobalt"} ${
            hideTaglineOnMobile ? "hidden sm:block" : "block"
          }`}
        >
          {t("tagline")}
        </small>
      </span>
    </span>
  );
}
