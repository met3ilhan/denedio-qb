import { defineConfig, devices } from "@playwright/test";

import { loadProjectEnv } from "./e2e/load-project-env";

loadProjectEnv();

import base from "./playwright.config";

/** One-shot live OpenRouter smoke — use `pnpm test:e2e:live` (loads `.env.local` + repo temp). */
export default defineConfig({
  ...base,
  globalSetup: "./e2e/live-global-setup.ts",
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
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
      QUESTION_STUDIO_LIVE_PROVIDER: process.env.QUESTION_STUDIO_LIVE_PROVIDER ?? "openrouter",
      ...(process.env.QUESTION_STUDIO_OPENROUTER_MODEL?.trim()
        ? { QUESTION_STUDIO_OPENROUTER_MODEL: process.env.QUESTION_STUDIO_OPENROUTER_MODEL.trim() }
        : {}),
      QUESTION_STUDIO_GEMINI_API_KEY: process.env.QUESTION_STUDIO_GEMINI_API_KEY ?? "",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
