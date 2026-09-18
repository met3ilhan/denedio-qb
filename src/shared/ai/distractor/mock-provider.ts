import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import { wrongChoices } from "@/shared/validation/generated-question";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import type { IDistractorAnalysisProvider } from "./types";

export class MockDistractorAnalysisProvider implements IDistractorAnalysisProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-distractor-v1";

  async analyze(input: { question: GeneratedQuestion; plan: MutationPlan; candidateId?: string }) {
    const started = Date.now();
    const regenBySlot = new Map(input.plan.distractor_regeneration.map((d) => [d.choice_slot, d]));

    const wrong_choices = wrongChoices(input.question).map((choice) => {
      const regen = regenBySlot.get(choice.label);
      const mechanism_id = regen?.mechanism_id ?? "MECH_ARITH";
      const misconception_id = regen?.misconception_id ?? `misc_${choice.label.toLowerCase()}`;
      const produces_value = choice.text;
      const student_action =
        regen?.parameter_notes?.trim() ||
        `Replay ${mechanism_id} path for choice ${choice.label} (${choice.text})`;
      return {
        choice_label: choice.label,
        mechanism_id,
        misconception_id,
        trap_type_ids: ["TRAP_PARTIAL"] as const,
        steps: [
          {
            order: 1,
            student_action,
          },
        ],
        produces_value,
      };
    });

    const output = distractorAnalysisSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      candidateId: input.candidateId,
      wrong_choices,
      all_mechanisms_from_fingerprint: true,
      decorative_distractor_flags: [],
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
