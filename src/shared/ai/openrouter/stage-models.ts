import { defaultOpenRouterModelId } from "./client";

export type OpenRouterStage =
  | "source"
  | "analysis"
  | "mutation"
  | "generation"
  | "distractor"
  | "solver";

const ENV_BY_STAGE: Record<OpenRouterStage, string> = {
  source: "QUESTION_STUDIO_OPENROUTER_SOURCE_MODEL",
  analysis: "QUESTION_STUDIO_OPENROUTER_ANALYSIS_MODEL",
  mutation: "QUESTION_STUDIO_OPENROUTER_GENERATION_MODEL",
  generation: "QUESTION_STUDIO_OPENROUTER_GENERATION_MODEL",
  distractor: "QUESTION_STUDIO_OPENROUTER_GENERATION_MODEL",
  solver: "QUESTION_STUDIO_OPENROUTER_SOLVER_MODEL",
};

export function openRouterModelForStage(stage: OpenRouterStage): string {
  const envKey = ENV_BY_STAGE[stage];
  const override = process.env[envKey]?.trim();
  if (override) {
    return override;
  }
  return defaultOpenRouterModelId();
}
