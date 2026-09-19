import { createStageProvider } from "../create-stage-provider";
import { GeminiSolverProvider } from "./gemini-provider";
import { OpenRouterSolverProvider } from "./openrouter-provider";
import { MockSolverProvider } from "./mock-provider";
import { UnconfiguredLiveSolverProvider } from "./unconfigured-live-provider";
import type { ISolverProvider } from "./types";

export type { ISolverProvider, SolverInput } from "./types";
export { toSolverInput } from "./types";
export { MockSolverProvider } from "./mock-provider";
export { solveFromStemOnly } from "./stem-solver";

const STAGE = "solver";

export function createSolverProvider(): ISolverProvider {
  return createStageProvider<ISolverProvider>(STAGE, {
    openrouter: () => new OpenRouterSolverProvider(process.env.OPENROUTER_API_KEY!.trim()),
    gemini: () => new GeminiSolverProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!.trim()),
    mock: () => new MockSolverProvider(),
    unconfiguredLive: () => new UnconfiguredLiveSolverProvider(),
  });
}

export function solverProviderConfigHash(provider: { providerId: string; modelId: string }): string {
  return `${provider.providerId}:${provider.modelId}:independent-solver`;
}
