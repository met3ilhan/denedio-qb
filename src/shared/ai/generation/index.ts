import { createStageProvider } from "../create-stage-provider";
import { GeminiGenerationProvider } from "./gemini-provider";
import { MockGenerationProvider } from "./mock-provider";
import { UnconfiguredLiveGenerationProvider } from "./unconfigured-live-provider";
import type { IGenerationProvider } from "./types";

export type { GenerationInput, IGenerationProvider } from "./types";
export { MockGenerationProvider } from "./mock-provider";
import {
  resetStageProviderCache,
  setStageProviderForTests,
} from "../create-stage-provider";

const STAGE = "generation";

export function setGenerationProviderForTests(next: IGenerationProvider | undefined): void {
  setStageProviderForTests(STAGE, next);
}

export function resetGenerationProviderCache(): void {
  resetStageProviderCache(STAGE);
}

export function createGenerationProvider(): IGenerationProvider {
  return createStageProvider<IGenerationProvider>(STAGE, {
    live: () => new GeminiGenerationProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!.trim()),
    mock: () => new MockGenerationProvider(),
    unconfiguredLive: () => new UnconfiguredLiveGenerationProvider(),
  });
}

export function generationProviderConfigHash(provider: IGenerationProvider): string {
  return `${provider.providerId}:${provider.modelId}:writer`;
}
