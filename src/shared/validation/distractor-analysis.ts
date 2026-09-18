import { z } from "zod";

import { mechanismId, trapTypeId } from "./pedagogy-enums";
import { choiceLabel, nonEmptyTrimmed, schemaVersion } from "./primitives";

const studioId = z.string().min(1);

const errorPathStep = z.object({
  order: z.number().int().min(1).max(3),
  student_action: nonEmptyTrimmed,
});

export const distractorChoiceAnalysisSchema = z.object({
  choice_label: choiceLabel,
  mechanism_id: mechanismId,
  misconception_id: nonEmptyTrimmed,
  trap_type_ids: z.array(trapTypeId).min(1),
  steps: z.array(errorPathStep).min(1).max(3),
  produces_value: nonEmptyTrimmed,
  validator_note: z.string().max(500).optional(),
});

export const distractorAnalysisSchema = z
  .object({
    schemaVersion,
    candidateId: studioId.optional(),
    wrong_choices: z.array(distractorChoiceAnalysisSchema).min(1),
    all_mechanisms_from_fingerprint: z.boolean(),
    decorative_distractor_flags: z.array(choiceLabel).default([]),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.decorative_distractor_flags.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "REJECT_DISTRACTOR: decorative distractor flagged",
      });
    }
  });

export type DistractorAnalysis = z.infer<typeof distractorAnalysisSchema>;
