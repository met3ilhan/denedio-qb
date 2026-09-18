import { defineConfig, devices } from "@playwright/test";

import base from "./playwright.config";

/** One-shot live Gemini smoke — not part of default `pnpm test:e2e`. */
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: /live-gemini-smoke\.spec\.ts/,
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
      ...(process.env.QUESTION_STUDIO_GEMINI_MODEL?.trim()
        ? { QUESTION_STUDIO_GEMINI_MODEL: process.env.QUESTION_STUDIO_GEMINI_MODEL.trim() }
        : {}),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
