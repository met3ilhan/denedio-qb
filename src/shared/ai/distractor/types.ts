import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { MutationPlan } from "@/shared/validation/mutation-plan";

import type { AIStageMeta } from "../generation/types";

export interface IDistractorAnalysisProvider {
  readonly providerId: string;
  readonly modelId: string;
  analyze(input: {
    question: GeneratedQuestion;
    plan: MutationPlan;
    candidateId?: string;
  }): Promise<{ output: DistractorAnalysis; meta: AIStageMeta }>;
}
