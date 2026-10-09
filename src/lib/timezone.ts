import { TIME_ZONE } from "./format";

/** Minutes the club's time zone is ahead of UTC at a given instant. */
function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** "2026-12-24T19:30" in Porto time → the matching instant (or null if malformed). */
export function lisbonInputToDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle the hour around DST changes.
  let guess = naive - offsetMinutes(new Date(naive)) * 60_000;
  guess = naive - offsetMinutes(new Date(guess)) * 60_000;
  return new Date(guess);
}

/** An instant → "YYYY-MM-DDTHH:mm" in Porto time, for <input type="datetime-local">. */
export function dateToLisbonInput(date: Date): string {
  const local = new Date(date.getTime() + offsetMinutes(date) * 60_000);
  return local.toISOString().slice(0, 16);
}
