/**
 * Visual configuration for the landing page's zone map. The counts shown next
 * to categories, zones and partners come from the database (landing-stats.ts):
 * only counts are public, offer details stay behind requireActiveMember().
 */
export const ZONES = [
  { id: "ribeira", tone: "ci-roof", color: "#D9653B", pin: { x: 255, y: 210 } },
  { id: "boavista", tone: "ci-violet", color: "#6B4FC7", pin: { x: 205, y: 150 } },
  { id: "foz", tone: "ci-sky", color: "#1F6FB8", pin: { x: 95, y: 120 } },
  { id: "gaia", tone: "ci-leaf", color: "#17935C", pin: { x: 285, y: 285 } },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];

export const CATEGORY_SLUGS = ["restaurants", "bars", "events", "culture", "leisure"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
