import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadDotenvLocal } from "./load-dotenv-local.mjs";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
loadDotenvLocal(root);

const fixture = path.join(root, "e2e", "fixtures", "live-smoke-tarih-question.png");
if (!fs.existsSync(fixture)) {
  const gen = spawnSync(
    "powershell",
    ["-ExecutionPolicy", "Bypass", "-File", path.join(root, "scripts", "generate-live-smoke-image.ps1")],
    { stdio: "inherit", cwd: root },
  );
  if (gen.status !== 0) {
    process.exit(gen.status ?? 1);
  }
}

if (!process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim()) {
  console.error("QUESTION_STUDIO_GEMINI_API_KEY is not set (configure .env.local)");
  process.exit(1);
}

process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
process.env.QUESTION_STUDIO_DEMO_MODE = "0";
process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE = "0";
process.env.PLAYWRIGHT_FORCE_NEW_SERVER = "1";
process.env.TMP = path.join(root, ".tmp-playwright", "tmp");
process.env.TEMP = process.env.TMP;

const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "-c", "playwright.live.config.ts"],
  { stdio: "inherit", cwd: root, env: process.env, shell: true },
);

process.exit(result.status ?? 1);
