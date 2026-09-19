export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logLiveAiStartupDiagnostics } = await import("@/shared/ai/startup-diagnostics");
    logLiveAiStartupDiagnostics();
  }
}
