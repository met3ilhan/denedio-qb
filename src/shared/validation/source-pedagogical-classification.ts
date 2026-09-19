import { z } from "zod";

import { bandInt } from "./pedagogical-fingerprint";
import { nonEmptyTrimmed, schemaVersion } from "./primitives";

export const sourcePedagogicalClassificationSchema = z
  .object({
    schemaVersion,
    subject: nonEmptyTrimmed,
    topic: nonEmptyTrimmed.optional(),
    subtopic: nonEmptyTrimmed.optional(),
    question_type: nonEmptyTrimmed.optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    expected_solve_time_seconds: bandInt.optional(),
    difficulty_rationale: z.string().max(1000).optional(),
  })
  .strict();

export type SourcePedagogicalClassification = z.infer<typeof sourcePedagogicalClassificationSchema>;
