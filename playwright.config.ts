import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";
import { E2E_WEBHOOK_SECRET } from "./e2e/constants";

// E2E_DATABASE_URL lives in .env.local. Tests never touch the dev or production database.
loadEnvConfig(process.cwd(), true);

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error("Set E2E_DATABASE_URL (see .env.example) before running e2e tests");


export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  // Mobile first: the 390px project runs every spec; desktop runs them too.
  projects: [
    {
      name: "mobile-390",
      use: { ...devices["iPhone 14"], browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // The build reads public counts from the database, so prepare it first.
    command: `npx prisma migrate deploy && npx prisma db seed && npm run build && npm run start -- -H localhost -p ${PORT}`,
    url: `${baseURL}/pt`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // Process env wins over .env files, so the build and server use the test database.
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_SITE_URL: baseURL,
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
      RESEND_API_KEY: "",
      SEED_SAMPLE_DATA: "true",
    },
  },
});
