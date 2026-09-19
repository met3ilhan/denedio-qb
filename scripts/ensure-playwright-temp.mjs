import fs from "node:fs";
import path from "node:path";

import { repoRoot } from "./load-local-env.mjs";

/** Repo-local Playwright transform/cache temp — avoids Windows EPERM under %TEMP%. */
export function ensurePlaywrightTemp(root = repoRoot) {
  const tempDir = path.join(root, ".tmp", "playwright-temp");
  fs.mkdirSync(tempDir, { recursive: true });
  process.env.TMP = tempDir;
  process.env.TEMP = tempDir;
  return tempDir;
}
