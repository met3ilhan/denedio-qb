import { resolveLiveVendorProvider } from "../create-stage-provider";
import { resolveProviderMode } from "../provider-mode";
import { GeminiSourceAnalystProvider } from "./gemini-provider";
import { OpenRouterSourceAnalystProvider } from "./openrouter-provider";
import { ManualSourceAnalystProvider } from "./manual-provider";
import { MockSourceAnalystProvider } from "./mock-provider";
import { UnconfiguredLiveSourceAnalystProvider } from "./unconfigured-live-provider";
import type { ISourceAnalystProvider } from "./types";

let provider: ISourceAnalystProvider | undefined;
let testOverride: ISourceAnalystProvider | undefined;

/** Test-only: spy / fake provider at the provider boundary. */
export function setSourceAnalystProviderForTests(next: ISourceAnalystProvider | undefined): void {
  testOverride = next;
  provider = undefined;
}

export function resetSourceAnalystProviderCache(): void {
  provider = undefined;
}

export function getSourceAnalystProvider(): ISourceAnalystProvider {
  if (testOverride) {
    return testOverride;
  }
  if (provider) {
    return provider;
  }

  const mode = resolveProviderMode();
  if (mode === "LIVE") {
    provider = resolveLiveVendorProvider<ISourceAnalystProvider>({
      openrouter: () =>
        new OpenRouterSourceAnalystProvider(process.env.OPENROUTER_API_KEY!.trim()),
      gemini: () => new GeminiSourceAnalystProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!),
      unconfiguredLive: () => new UnconfiguredLiveSourceAnalystProvider(),
    });
  } else if (mode === "MANUAL") {
    provider = new ManualSourceAnalystProvider();
  } else {
    provider = new MockSourceAnalystProvider();
  }

  return provider;
}

export type { ISourceAnalystProvider, SourceAnalystInput } from "./types";
