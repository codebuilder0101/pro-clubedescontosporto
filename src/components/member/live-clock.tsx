"use client";

import { useSyncExternalStore } from "react";
import { TIME_ZONE } from "@/lib/format";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const now = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => null;

/**
 * Running clock in Porto time. Staff compare it with the real time: a
 * screenshot shows a frozen clock. Renders placeholders on the server.
 */
export function LiveClock({ label, className = "" }: { label: string; className?: string }) {
  const seconds = useSyncExternalStore(subscribe, now, serverSnapshot);
  const text =
    seconds === null
      ? "--:--:--"
      : new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
          timeZone: TIME_ZONE,
        }).format(new Date(seconds * 1000));
  return (
    <p className={`clock ${className}`}>
      <span className="sr-only">{label}: </span>
      <time suppressHydrationWarning>{text}</time>
    </p>
  );
}
