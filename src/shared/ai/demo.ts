export function isDemoMode(): boolean {
  const flag = process.env.QUESTION_STUDIO_DEMO_MODE;
  return flag === "1" || flag === "true";
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim());
}
