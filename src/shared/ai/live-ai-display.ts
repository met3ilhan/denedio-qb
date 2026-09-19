/** Client-safe LIVE AI labels (no Node-only imports). */

export function liveAiExpertLabel(providerId?: string | null): string {
  if (providerId === "gemini") {
    return "Canlı AI · Gemini";
  }
  if (providerId === "openrouter") {
    return "Canlı AI · GPT-5.6 Luna";
  }
  return "Canlı AI · GPT-5.6 Luna";
}
