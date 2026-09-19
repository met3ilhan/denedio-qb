import { spawnSync } from "node:child_process";

import { loadLocalEnv, repoRoot } from "./load-local-env.mjs";

process.chdir(repoRoot);
loadLocalEnv(repoRoot);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-local-env.mjs <command...>");
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  cwd: repoRoot,
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
