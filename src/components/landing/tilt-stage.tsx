"use client";

import { useRef, type ComponentPropsWithoutRef, type PointerEvent } from "react";

/**
 * Wrapper that tilts its `.tilt-target` descendant towards the mouse by
 * setting CSS variables (--rx, --ry, --shine). Mouse only; touch and
 * reduced-motion users keep the resting pose defined in CSS.
 */
export function TiltStage({ children, ...props }: ComponentPropsWithoutRef<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(10 - y * 22).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(-14 + x * 30).toFixed(2)}deg`);
    el.style.setProperty("--rz", "3deg");
    el.style.setProperty("--shine", `${(x * 120).toFixed(1)}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    for (const p of ["--rx", "--ry", "--rz", "--shine"]) el.style.removeProperty(p);
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} {...props}>
      {children}
    </div>
  );
}
