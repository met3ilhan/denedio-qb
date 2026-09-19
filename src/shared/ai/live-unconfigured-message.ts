import { resolveLiveProvider } from "./provider-mode";

export function liveVendorUnconfiguredMessage(stage: string): string {
  const vendor = resolveLiveProvider();
  if (vendor === "openrouter") {
    return (
      `Canlı ${stage} için OPENROUTER_API_KEY yapılandırılmalıdır. ` +
      "Mock moduna veya demo içeriğe sessizce düşülmez."
    );
  }
  return (
    `Canlı ${stage} için QUESTION_STUDIO_GEMINI_API_KEY yapılandırılmalıdır. ` +
    "Mock moduna veya demo içeriğe sessizce düşülmez."
  );
}
