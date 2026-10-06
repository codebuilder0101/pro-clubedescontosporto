/**
 * Static landing-page figures.
 * TODO(db): replace with aggregate counts of published offers once Prisma exists.
 * Only counts are public; offer details stay behind requireActiveMember().
 */
export const ACTIVE_PARTNERS = 128;

export const CATEGORY_COUNTS = {
  restaurants: 48,
  bars: 26,
  events: 14,
  culture: 19,
  leisure: 22,
} as const;

export const TOTAL_OFFERS = Object.values(CATEGORY_COUNTS).reduce((a, b) => a + b, 0);

export const ZONES = [
  { id: "ribeira", count: 41, tone: "ci-roof", color: "#D9653B", pin: { x: 255, y: 210 } },
  { id: "boavista", count: 33, tone: "ci-violet", color: "#6B4FC7", pin: { x: 205, y: 150 } },
  { id: "foz", count: 29, tone: "ci-sky", color: "#1F6FB8", pin: { x: 95, y: 120 } },
  { id: "gaia", count: 25, tone: "ci-leaf", color: "#17935C", pin: { x: 285, y: 285 } },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];
