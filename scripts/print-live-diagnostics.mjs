import { ensurePlaywrightTemp } from "./ensure-playwright-temp.mjs";
import { isEnvConfigured, repoRoot } from "./load-local-env.mjs";

function resolveLiveProviderLabel() {
  const raw = process.env.QUESTION_STUDIO_LIVE_PROVIDER?.trim().toLowerCase();
  if (raw === "gemini") return "Gemini";
  return "OpenRouter";
}

function defaultOpenRouterModel() {
  return (
    process.env.QUESTION_STUDIO_OPENROUTER_MODEL?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    "openai/gpt-5.6-luna"
  );
}

export function printLiveDiagnostics(root = repoRoot) {
  const tempDir = ensurePlaywrightTemp(root);
  const providerMode = process.env.QUESTION_STUDIO_PROVIDER_MODE?.trim() || "(unset)";
  const demoRaw = process.env.QUESTION_STUDIO_DEMO_MODE?.trim();
  const demoLabel =
    demoRaw === "0" ? "OFF" : demoRaw === "1" ? "ON" : demoRaw ? demoRaw : "(unset)";
  const liveVendor = resolveLiveProviderLabel();

  console.log(`Database URL configured: ${isEnvConfigured("DATABASE_URL") ? "YES" : "NO"}`);
  console.log(`Live provider: ${liveVendor}`);
  console.log(
    `OpenRouter key configured: ${isEnvConfigured("OPENROUTER_API_KEY") ? "YES" : "NO"}`,
  );
  console.log(
    `Gemini key configured: ${isEnvConfigured("QUESTION_STUDIO_GEMINI_API_KEY") ? "YES" : "NO"}`,
  );
  if (liveVendor === "OpenRouter") {
    console.log(`Default model: ${defaultOpenRouterModel()}`);
  }
  console.log(`Provider mode: ${providerMode}`);
  console.log(`Demo mode: ${demoLabel}`);
  console.log(`Playwright temp: ${tempDir}`);
}

export function requireOpenRouterKeyForLive() {
  const vendor = process.env.QUESTION_STUDIO_LIVE_PROVIDER?.trim().toLowerCase();
  if (vendor === "gemini") {
    if (!isEnvConfigured("QUESTION_STUDIO_GEMINI_API_KEY")) {
      console.error(
        "Live Gemini tests require QUESTION_STUDIO_GEMINI_API_KEY in .env.local (or your shell environment).",
      );
      process.exit(1);
    }
    return;
  }
  if (!isEnvConfigured("OPENROUTER_API_KEY")) {
    console.error(
      "Live OpenRouter tests require OPENROUTER_API_KEY in .env.local (or your shell environment).",
    );
    process.exit(1);
  }
}

/** @deprecated Use requireOpenRouterKeyForLive */
export function requireGeminiKeyForLive() {
  requireOpenRouterKeyForLive();
}
