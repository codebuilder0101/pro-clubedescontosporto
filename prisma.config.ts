import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";

// Same .env files as Next.js. The Prisma CLI uses the development files
// (.env.local) unless NODE_ENV=production, so `npx prisma migrate dev` can
// never reach the production database by accident. Variables already set in
// the environment win (Playwright passes the test DATABASE_URL this way).
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
