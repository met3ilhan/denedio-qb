import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
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
    command: process.env.CI
      ? "pnpm start"
      : "pnpm exec next dev --turbopack -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.PLAYWRIGHT_FORCE_NEW_SERVER,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://question_studio:question_studio@localhost:5433/question_studio",
      QUESTION_STUDIO_DEMO_MODE: process.env.QUESTION_STUDIO_DEMO_MODE ?? "1",
      NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE: process.env.QUESTION_STUDIO_DEMO_MODE ?? "1",
    },
  },
});
