import { randomInt } from "node:crypto";

/** Random 8-digit member number (stored without spaces; unique in the DB). */
export function generateMemberNumber(): string {
  return String(randomInt(0, 100_000_000)).padStart(8, "0");
}
