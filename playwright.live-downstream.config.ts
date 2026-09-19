import { defineConfig, devices } from "@playwright/test";

import { loadProjectEnv } from "./e2e/load-project-env";

loadProjectEnv();

import base from "./playwright.config";

/** Downstream-only live Gemini acceptance — starts from seeded locked fingerprint. */
export default defineConfig({
  ...base,
  globalSetup: "./e2e/live-downstream-global-setup.ts",
  testIgnore: [],
  testMatch: /live-downstream-smoke\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  webServer: {
    command: "pnpm exec next start -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://question_studio:question_studio@localhost:5433/question_studio",
      QUESTION_STUDIO_PROVIDER_MODE: "LIVE",
      QUESTION_STUDIO_DEMO_MODE: "0",
      NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE: "0",
      QUESTION_STUDIO_GEMINI_API_KEY: process.env.QUESTION_STUDIO_GEMINI_API_KEY ?? "",
      QUESTION_STUDIO_GENERATION_CANDIDATE_COUNT: "1",
      ...(process.env.QUESTION_STUDIO_GEMINI_MODEL?.trim()
        ? { QUESTION_STUDIO_GEMINI_MODEL: process.env.QUESTION_STUDIO_GEMINI_MODEL.trim() }
        : {}),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
