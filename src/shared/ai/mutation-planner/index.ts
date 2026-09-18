import { createStageProvider } from "../create-stage-provider";
import { GeminiMutationPlannerProvider } from "./gemini-provider";
import { MockMutationPlannerProvider } from "./mock-provider";
import { UnconfiguredLiveMutationPlannerProvider } from "./unconfigured-live-provider";
import type { IMutationPlannerProvider } from "./types";

export type { IMutationPlannerProvider, MutationPlannerInput } from "./types";
export { MockMutationPlannerProvider } from "./mock-provider";

const STAGE = "mutation-planner";

export function createMutationPlannerProvider(): IMutationPlannerProvider {
  return createStageProvider<IMutationPlannerProvider>(STAGE, {
    live: () => new GeminiMutationPlannerProvider(process.env.QUESTION_STUDIO_GEMINI_API_KEY!.trim()),
    mock: () => new MockMutationPlannerProvider(),
    unconfiguredLive: () => new UnconfiguredLiveMutationPlannerProvider(),
  });
}
