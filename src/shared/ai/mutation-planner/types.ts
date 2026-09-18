import type { MutationPlan } from "@/shared/validation/mutation-plan";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import type { SourceExtraction } from "@/shared/validation/source-extraction";
import type { AIStageMeta } from "../generation/types";

export type MutationPlannerInput = {
  fingerprintVersionId: string;
  fingerprint: PedagogicalFingerprint;
  extraction: Pick<SourceExtraction, "stemText" | "choices" | "solutionText" | "language">;
  sourceQuestionId: string;
};

export interface IMutationPlannerProvider {
  readonly providerId: string;
  readonly modelId: string;
  plan(input: MutationPlannerInput): Promise<{ output: MutationPlan; meta: AIStageMeta }>;
}
