import { useId } from "react";
import type { DiscountLike } from "@/lib/discount";
import { useDiscountLabel } from "./offer-card";

/** Round sun badge with the discount and a circular "member exclusive" text. */
export function FeaturedBadge({ discount, label }: { discount: DiscountLike; label: string }) {
  const text = useDiscountLabel();
  const id = `fb${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span className="relative grid size-[108px] flex-none place-items-center sm:size-[124px]">
      <svg viewBox="0 0 120 120" aria-hidden="true" className="absolute inset-0 size-full animate-spin-slow">
        <defs>
          <path id={id} d="M60 60m-52 0a52 52 0 1 1 104 0a52 52 0 1 1-104 0" />
        </defs>
        <text fontWeight="800" fontSize="10" letterSpacing="2.4" fill="#fff" style={{ textTransform: "uppercase" }}>
          <textPath href={`#${id}`}>{`${label} · ${label} ·`}</textPath>
        </text>
      </svg>
      <span className="grid size-[72%] place-items-center rounded-full bg-sun font-display text-[clamp(22px,2.4vw,30px)] font-extrabold text-ink shadow-[0_10px_24px_-8px_rgba(150,100,0,.7)]">
        {text(discount)}
      </span>
    </span>
  );
}
