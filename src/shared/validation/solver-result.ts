import { z } from "zod";

import { operationType } from "./pedagogy-enums";
import { choiceLabel, schemaVersion } from "./primitives";

const studioId = z.string().min(1);

export const solverResultSchema = z
  .object({
    schemaVersion,
    solverRunId: studioId.optional(),
    selected_label: choiceLabel.nullable(),
    is_unique: z.boolean(),
    ambiguity_reason: z.string().max(1000).optional(),
    reasoning_trace: z.array(
      z.object({
        step: z.number().int().positive(),
        description: z.string().max(2000),
        operation_type: operationType.optional(),
      }),
    ),
    matches_expected_correct: z.boolean().optional(),
    confidence_band: z.enum(["high", "medium", "low"]),
    providerId: z.string(),
    modelId: z.string(),
  })
  .strict();

export type SolverResult = z.infer<typeof solverResultSchema>;
