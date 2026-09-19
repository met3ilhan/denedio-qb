import { ensurePlaywrightTemp } from "./ensure-playwright-temp.mjs";
import { isEnvConfigured, repoRoot } from "./load-local-env.mjs";

export function printLiveDiagnostics(root = repoRoot) {
  const tempDir = ensurePlaywrightTemp(root);
  const providerMode = process.env.QUESTION_STUDIO_PROVIDER_MODE?.trim() || "(unset)";
  const demoRaw = process.env.QUESTION_STUDIO_DEMO_MODE?.trim();
  const demoLabel =
    demoRaw === "0" ? "OFF" : demoRaw === "1" ? "ON" : demoRaw ? demoRaw : "(unset)";

  console.log(`Database URL configured: ${isEnvConfigured("DATABASE_URL") ? "YES" : "NO"}`);
  console.log(
    `Gemini key configured: ${isEnvConfigured("QUESTION_STUDIO_GEMINI_API_KEY") ? "YES" : "NO"}`,
  );
  console.log(`Provider mode: ${providerMode}`);
  console.log(`Demo mode: ${demoLabel}`);
  console.log(`Playwright temp: ${tempDir}`);
}

export function requireGeminiKeyForLive() {
  if (!isEnvConfigured("QUESTION_STUDIO_GEMINI_API_KEY")) {
    console.error(
      "Live Gemini tests require QUESTION_STUDIO_GEMINI_API_KEY in .env.local (or your shell environment).",
    );
    process.exit(1);
  }
}
