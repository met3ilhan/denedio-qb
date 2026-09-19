import {
  defaultOpenRouterModelSlug,
  hasOpenRouterApiKey,
  isDemoMode,
  resolveLiveProvider,
  resolveProviderMode,
} from "./provider-mode";

/** Safe console diagnostics on server boot (never prints secrets). */
export function logLiveAiStartupDiagnostics(): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const mode = resolveProviderMode();
  const liveVendor = resolveLiveProvider();
  const demo = isDemoMode() ? "ON" : "OFF";

  if (mode !== "LIVE") {
    return;
  }

  console.log("[Question Studio] Live AI diagnostics:");
  console.log(`  Live provider: ${liveVendor === "openrouter" ? "OpenRouter" : "Gemini"}`);
  if (liveVendor === "openrouter") {
    console.log(`  OpenRouter key configured: ${hasOpenRouterApiKey() ? "YES" : "NO"}`);
    console.log(`  Default model: ${defaultOpenRouterModelSlug()}`);
  } else {
    console.log(
      `  Gemini key configured: ${process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim() ? "YES" : "NO"}`,
    );
  }
  console.log(`  Demo mode: ${demo}`);
}
