import path from "node:path";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..");

/** Next-compatible env load (.env, .env.local, development/production variants). Does not log secret values. */
export function loadLocalEnv(cwd = repoRoot) {
  const dev = process.env.NODE_ENV !== "production";
  return loadEnvConfig(cwd, dev);
}

export function isEnvConfigured(name) {
  return Boolean(process.env[name]?.trim());
}
