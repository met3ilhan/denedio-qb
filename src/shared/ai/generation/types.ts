import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";

export type GenerationStageContext = {
  missionId: string;
  generationRunId: string;
  mutationPlanId: string;
  sourceQuestionId: string;
  fingerprintVersionId: string;
};

export type GenerationInput = {
  context: GenerationStageContext;
  fingerprint: PedagogicalFingerprint;
  plan: MutationPlan;
};

import type { OpenRouterUsageTelemetry } from "../openrouter/usage";

export type AIStageMeta = {
  providerId: string;
  modelId: string;
  latencyMs: number;
  usage?: OpenRouterUsageTelemetry;
};

export interface IGenerationProvider {
  readonly providerId: string;
  readonly modelId: string;
  generate(input: GenerationInput): Promise<{ output: GeneratedQuestion; meta: AIStageMeta }>;
}
