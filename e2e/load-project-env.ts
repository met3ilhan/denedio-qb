import { loadEnvConfig } from "@next/env";

/** Next-compatible env load for Playwright / e2e (includes `.env.local`). */
export function loadProjectEnv(): void {
  const dev = process.env.NODE_ENV !== "production";
  loadEnvConfig(process.cwd(), dev);
}
