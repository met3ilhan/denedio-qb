import { CORE_INVARIANT_ASSERTION_DIMENSIONS } from "@/shared/validation/pedagogical-fingerprint";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { previewTrivialMutationFlags } from "@/shared/validation/trivial-mutation";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

/** Hand-authored plan for tests and S08 default template. */
export function buildSampleMutationPlan(fingerprintVersionId: string) {
  return mutationPlanSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    fingerprint_ref: fingerprintVersionId,
    surface_mutations: [
      {
        dimension: "context",
        description: "Swap kayak rental for workshop tool rental while keeping interval pricing.",
      },
      {
        dimension: "numbers",
        description: "Rescale first-interval and additional-interval fees within light_mental band.",
      },
    ],
    invariant_assertions: CORE_INVARIANT_ASSERTION_DIMENSIONS.map((dimension) => ({
      dimension,
      assertion: `${dimension} preserved by class — see locked fingerprint vN`,
      expected: `${dimension} structural class unchanged vs locked fingerprint`,
    })),
    operand_constraints:
      "Keep additional-interval count logic identical; operands remain small integers under 20.",
    distractor_regeneration: [
      {
        choice_slot: "A",
        mechanism_id: "MECH_PARTIAL",
        misconception_id: "misc_partial_sum_a",
        parameter_notes: "Partial sum omitting final interval",
      },
      {
        choice_slot: "C",
        mechanism_id: "MECH_ARITH",
        misconception_id: "misc_partial_sum_c",
        parameter_notes: "Off-by-one interval in multiplication",
      },
      {
        choice_slot: "D",
        mechanism_id: "MECH_BOUNDARY",
        misconception_id: "misc_partial_sum_d",
        parameter_notes: "Treat all hours at additional rate",
      },
    ],
    anti_copy_notes:
      "Stem reframes the story as equipment rental with different names; pricing sentences reordered but signal role unchanged.",
  });
}

export { previewTrivialMutationFlags };
