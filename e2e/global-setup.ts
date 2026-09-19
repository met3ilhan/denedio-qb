import { execSync } from "node:child_process";

import { loadProjectEnv } from "./load-project-env";

export default function globalSetup() {
  loadProjectEnv();

  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://question_studio:question_studio@localhost:5433/question_studio";

  process.env.DATABASE_URL = databaseUrl;
  process.env.QUESTION_STUDIO_DEMO_MODE = process.env.QUESTION_STUDIO_DEMO_MODE ?? "1";

  try {
    execSync("docker compose up -d question-studio-db", { stdio: "ignore" });
  } catch {
    // Docker may already be running or unavailable in constrained environments.
  }

  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
