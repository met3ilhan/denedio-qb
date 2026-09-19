import { spawnSync } from "node:child_process";
import path from "node:path";

import { loadProjectEnv } from "./load-project-env";
import globalSetup from "./global-setup";

export default async function liveDownstreamGlobalSetup() {
  loadProjectEnv();

  if (!process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim()) {
    throw new Error(
      "Live downstream tests require QUESTION_STUDIO_GEMINI_API_KEY in .env.local.",
    );
  }

  process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
  process.env.QUESTION_STUDIO_DEMO_MODE = "0";
  process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE = "0";

  console.log("Live downstream smoke — global setup:");
  console.log(`Database URL configured: ${process.env.DATABASE_URL?.trim() ? "YES" : "NO"}`);
  console.log("Gemini key configured: YES");
  console.log(`Provider mode: ${process.env.QUESTION_STUDIO_PROVIDER_MODE}`);

  await globalSetup();

  const repoRoot = path.resolve(__dirname, "..");
  const seed = spawnSync("node", [path.join(repoRoot, "scripts", "seed-live-downstream-fixture.mjs")], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });
  if (seed.status !== 0) {
    throw new Error("Failed to seed live downstream fixture");
  }
}
