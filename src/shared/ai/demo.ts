export function isDemoMode(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE ??
    process.env.QUESTION_STUDIO_DEMO_MODE;
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  // Local Question Studio defaults to disclosed demo/mock fixtures unless explicitly disabled.
  return true;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim());
}
