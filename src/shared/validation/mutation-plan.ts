import { z } from "zod";

import { CORE_INVARIANT_ASSERTION_DIMENSIONS } from "./pedagogical-fingerprint";
import { mechanismId, trapTypeId } from "./pedagogy-enums";
import { choiceLabel, nonEmptyTrimmed, schemaVersion } from "./primitives";

export const surfaceMutation = z
  .object({
    dimension: z.enum([
      "context",
      "names",
      "numbers",
      "diagram_class",
      "wording_structure",
      "information_order_presentation",
      "choice_order",
    ]),
    description: nonEmptyTrimmed,
  })
  .strict();

export const distractorRegenerationEntry = z
  .object({
    choice_slot: choiceLabel,
    mechanism_id: mechanismId,
    misconception_id: nonEmptyTrimmed,
    parameter_notes: z.string().max(1000),
  })
  .strict();

export const mutationPlanSchema = z
  .object({
    schemaVersion,
    planId: z.string().optional(),
    fingerprint_ref: z.string().min(1),
    surface_mutations: z.array(surfaceMutation).min(1),
    invariant_assertions: z.array(
      z
        .object({
          dimension: nonEmptyTrimmed,
          assertion: nonEmptyTrimmed,
          /** Machine-checkable expectation — not a substitute for evidence at lock time. */
          expected: nonEmptyTrimmed,
        })
        .strict(),
    ),
    operand_constraints: z.string().max(2000),
    distractor_regeneration: z.array(distractorRegenerationEntry).min(1),
    anti_copy_notes: nonEmptyTrimmed,
    sibling_group_id: z.string().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const asserted = new Set(val.invariant_assertions.map((a) => a.dimension));
    for (const required of CORE_INVARIANT_ASSERTION_DIMENSIONS) {
      if (!asserted.has(required)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["invariant_assertions"],
          message: `missing invariant assertion for ${required}`,
        });
      }
    }
  });

export type MutationPlan = z.infer<typeof mutationPlanSchema>;
