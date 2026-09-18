import { hasGeminiApiKey, isDemoMode } from "../demo";
import { GeminiSourceAnalystProvider } from "./gemini-provider";
import { MockSourceAnalystProvider } from "./mock-provider";
import type { ISourceAnalystProvider } from "./types";

let provider: ISourceAnalystProvider | undefined;

export function getSourceAnalystProvider(): ISourceAnalystProvider {
  if (provider) {
    return provider;
  }

  if (!isDemoMode() && hasGeminiApiKey()) {
    provider = new GeminiSourceAnalystProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!);
  } else {
    provider = new MockSourceAnalystProvider();
  }

  return provider;
}

export type { ISourceAnalystProvider, SourceAnalystInput } from "./types";
