import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: [/live-gemini-smoke\.spec\.ts/],
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // test:e2e runs `pnpm build` first — production server avoids Turbopack instability under parallel workers.
    command: "pnpm exec next start -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.PLAYWRIGHT_FORCE_NEW_SERVER,
    timeout: 180_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://question_studio:question_studio@localhost:5433/question_studio",
      // Deterministic mock analyst for regression — never inherit LIVE from developer .env.local.
      QUESTION_STUDIO_PROVIDER_MODE: "MOCK",
      QUESTION_STUDIO_DEMO_MODE: "1",
      NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE: "1",
      QUESTION_STUDIO_GEMINI_API_KEY: "",
    },
  },
});
