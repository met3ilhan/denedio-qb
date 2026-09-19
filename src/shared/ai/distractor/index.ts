import { createStageProvider } from "../create-stage-provider";
import { GeminiDistractorAnalysisProvider } from "./gemini-provider";
import { OpenRouterDistractorAnalysisProvider } from "./openrouter-provider";
import { MockDistractorAnalysisProvider } from "./mock-provider";
import { UnconfiguredLiveDistractorProvider } from "./unconfigured-live-provider";
import type { IDistractorAnalysisProvider } from "./types";

export type { IDistractorAnalysisProvider } from "./types";
export { MockDistractorAnalysisProvider } from "./mock-provider";

const STAGE = "distractor";

export function createDistractorAnalysisProvider(): IDistractorAnalysisProvider {
  return createStageProvider<IDistractorAnalysisProvider>(STAGE, {
    openrouter: () =>
      new OpenRouterDistractorAnalysisProvider(process.env.OPENROUTER_API_KEY!.trim()),
    gemini: () => new GeminiDistractorAnalysisProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!.trim()),
    mock: () => new MockDistractorAnalysisProvider(),
    unconfiguredLive: () => new UnconfiguredLiveDistractorProvider(),
  });
}
