import type { ReactNode } from "react";

/** Eyebrow + h2 (+ optional aside) used at the top of every landing section. */
export function SectionHead({
  id,
  eyebrow,
  title,
  aside,
  center = false,
  className = "",
}: {
  /** id for the h2, referenced by the section's aria-labelledby. */
  id: string;
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={`sec-head reveal ${center ? "center" : ""} ${className}`}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id} className="h2">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}

/** Decorative wave divider between sections. */
export function Wave({
  d,
  fill,
  background,
  flip = false,
}: {
  d: string;
  fill: string;
  background?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className="wave"
      viewBox="0 0 1440 110"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ background, transform: flip ? "scaleY(-1)" : undefined }}
    >
      <path d={d} fill={fill} />
    </svg>
  );
}

export const WAVE_A = "M0 60C240 10 480 110 720 70S1200 0 1440 50V110H0Z";
export const WAVE_B = "M0 40C300 110 560 0 860 50S1260 100 1440 30V110H0Z";
