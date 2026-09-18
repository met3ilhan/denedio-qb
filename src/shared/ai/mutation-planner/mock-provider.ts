import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";

import type { IMutationPlannerProvider, MutationPlannerInput } from "./types";

export class MockMutationPlannerProvider implements IMutationPlannerProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-mutation-planner-v1";

  async plan(input: MutationPlannerInput) {
    const started = Date.now();
    const base = buildSampleMutationPlan(input.fingerprintVersionId);
    const archetype = input.fingerprint.question_archetype.archetype_id;
    const isHistory =
      input.extraction.language === "tr" &&
      (archetype.includes("HIST") ||
        input.fingerprint.calculation_burden === "none" ||
        input.extraction.stemText.toLowerCase().includes("osman"));

    const output = mutationPlanSchema.parse({
      ...base,
      surface_mutations: isHistory
        ? [
            {
              dimension: "context",
              description:
                "Replace Ottoman-era actors and treaty context with a different period/event while keeping causal reasoning structure",
            },
            {
              dimension: "names",
              description: "Use new historical figures and place names not present in source",
            },
            {
              dimension: "wording_structure",
              description: "Rewrite stem with different clause order; avoid source sentence template",
            },
          ]
        : base.surface_mutations,
      anti_copy_notes: isHistory
        ? "History sibling: new event/actors; same inference skill; no source wording reuse"
        : base.anti_copy_notes,
    });

    return {
      output,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        latencyMs: Date.now() - started,
      },
    };
  }
}
