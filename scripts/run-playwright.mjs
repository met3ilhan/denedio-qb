import { spawnSync } from "node:child_process";

import { ensurePlaywrightTemp } from "./ensure-playwright-temp.mjs";
import { loadLocalEnv, repoRoot } from "./load-local-env.mjs";

process.chdir(repoRoot);
loadLocalEnv(repoRoot);
ensurePlaywrightTemp(repoRoot);

const playwrightArgs = process.argv.slice(2);
if (playwrightArgs.length === 0) {
  playwrightArgs.push("test");
}

const result = spawnSync("pnpm", ["exec", "playwright", ...playwrightArgs], {
  stdio: "inherit",
  cwd: repoRoot,
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
