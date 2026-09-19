import { resolveLiveVendorProvider } from "../create-stage-provider";
import { resolveProviderMode } from "../provider-mode";
import { GeminiFingerprintAnalystProvider } from "./gemini-provider";
import { OpenRouterFingerprintAnalystProvider } from "./openrouter-provider";
import { MockFingerprintAnalystProvider } from "./mock-provider";
import { UnconfiguredLiveFingerprintAnalystProvider } from "./unconfigured-live-provider";
import type { IFingerprintAnalystProvider } from "./types";

let provider: IFingerprintAnalystProvider | undefined;
let testOverride: IFingerprintAnalystProvider | undefined;

export function setFingerprintAnalystProviderForTests(next: IFingerprintAnalystProvider | undefined): void {
  testOverride = next;
  provider = undefined;
}

export function resetFingerprintAnalystProviderCache(): void {
  provider = undefined;
}

export function getFingerprintAnalystProvider(): IFingerprintAnalystProvider {
  if (testOverride) return testOverride;
  if (provider) return provider;

  const mode = resolveProviderMode();
  if (mode === "LIVE") {
    provider = resolveLiveVendorProvider<IFingerprintAnalystProvider>({
      openrouter: () =>
        new OpenRouterFingerprintAnalystProvider(process.env.OPENROUTER_API_KEY!.trim()),
      gemini: () =>
        new GeminiFingerprintAnalystProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!),
      unconfiguredLive: () => new UnconfiguredLiveFingerprintAnalystProvider(),
    });
  } else {
    provider = new MockFingerprintAnalystProvider();
  }

  return provider;
}

export type { FingerprintAnalystInput, FingerprintAnalystResult, IFingerprintAnalystProvider } from "./types";
export {
  detectFingerprintDomain,
  fingerprintDomainMatchesStem,
  isLegacyStaticPiecewiseFingerprint,
} from "./domain-detect";
