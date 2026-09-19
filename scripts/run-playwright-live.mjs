import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { ensurePlaywrightTemp } from "./ensure-playwright-temp.mjs";
import { loadLocalEnv, repoRoot } from "./load-local-env.mjs";
import { printLiveDiagnostics, requireGeminiKeyForLive } from "./print-live-diagnostics.mjs";

process.chdir(repoRoot);
loadLocalEnv(repoRoot);
ensurePlaywrightTemp(repoRoot);

const fixture = path.join(repoRoot, "e2e", "fixtures", "live-smoke-tarih-question.png");
if (!fs.existsSync(fixture)) {
  const gen = spawnSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(repoRoot, "scripts", "generate-live-smoke-image.ps1"),
    ],
    { stdio: "inherit", cwd: repoRoot },
  );
  if (gen.status !== 0) {
    process.exit(gen.status ?? 1);
  }
}

requireGeminiKeyForLive();

process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
process.env.QUESTION_STUDIO_DEMO_MODE = "0";
process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE = "0";
process.env.PLAYWRIGHT_FORCE_NEW_SERVER = "1";

console.log("Live Gemini smoke — startup diagnostics:");
printLiveDiagnostics(repoRoot);
console.log("");

const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "-c", "playwright.live.config.ts"],
  { stdio: "inherit", cwd: repoRoot, env: process.env, shell: true },
);

process.exit(result.status ?? 1);
