import { hasGeminiApiKey } from "../demo";
import { GeminiGenerationProvider } from "./gemini-provider";
import { MockGenerationProvider } from "./mock-provider";
import type { IGenerationProvider } from "./types";

export type { GenerationInput, IGenerationProvider } from "./types";
export { MockGenerationProvider } from "./mock-provider";

export function createGenerationProvider(): IGenerationProvider {
  if (hasGeminiApiKey()) {
    return new GeminiGenerationProvider();
  }
  return new MockGenerationProvider();
}

export function generationProviderConfigHash(provider: IGenerationProvider): string {
  return `${provider.providerId}:${provider.modelId}`;
}
