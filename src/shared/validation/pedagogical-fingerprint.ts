import { z } from "zod";

import {
  fingerprintDimensionVerdict,
  mechanismId,
  operationType,
  trapTypeId,
} from "./pedagogy-enums";
import { evidencePointer, nonEmptyTrimmed, schemaVersion } from "./primitives";

export const bandInt = z
  .object({
    min: z.number().int(),
    max: z.number().int(),
  })
  .strict()
  .refine((b) => b.min <= b.max, { message: "band min must be <= max" });

export const solutionSkeletonPhase = z
  .object({
    phase_id: z.string(),
    operation_type: operationType,
    depends_on: z.array(z.string()).default([]),
    critical_substep: z.boolean(),
    description: z.string().max(500),
  })
  .strict();

export const distractorMechanismSlot = z
  .object({
    slot: z.string(),
    mechanism_id: mechanismId,
    trap_type_ids: z.array(trapTypeId).min(1),
    misconception_id: nonEmptyTrimmed,
    summary: z.string().max(500),
  })
  .strict();

export const fingerprintDimensionEvidence = z
  .object({
    dimensionKey: z.string(),
    verdict: fingerprintDimensionVerdict.default("UNVERIFIED"),
    evidence: z.array(evidencePointer).min(0),
    rationale: z.string().max(2000).optional(),
  })
  .strict();

export const pedagogicalFingerprintSchema = z
  .object({
    schemaVersion,
    fingerprintId: z.string().optional(),
    sourceQuestionId: z.string().optional(),
    measured_skill: nonEmptyTrimmed,
    learning_objective: nonEmptyTrimmed,
    cognitive_operation: nonEmptyTrimmed,
    reasoning_pattern: nonEmptyTrimmed,
    solution_skeleton: z.array(solutionSkeletonPhase).min(1),
    critical_signal: z
      .object({
        role: nonEmptyTrimmed,
        surface_form_notes: z.string().max(1000).optional(),
      })
      .strict(),
    hidden_constraint: nonEmptyTrimmed,
    reasoning_steps: bandInt,
    information_order: nonEmptyTrimmed,
    calculation_burden: z.enum([
      "none",
      "light_mental",
      "multi_step_numeric",
      "symbolic",
      "calculator_expected",
    ]),
    language_burden: z.enum(["low", "medium", "high"]),
    visual_reasoning_burden: z.enum([
      "none",
      "decode_diagram",
      "spatial_transform",
      "graph_read",
      "table_cross_reference",
      "combined",
    ]),
    distractor_mechanisms: z.array(distractorMechanismSlot).min(1),
    misconception_targets: z.array(nonEmptyTrimmed).min(1),
    trap_types: z.array(trapTypeId).min(1),
    elimination_opportunities: z.array(nonEmptyTrimmed),
    difficulty_factors: z.array(
      z
        .object({
          factor: nonEmptyTrimmed,
          weight: z.enum(["primary", "secondary"]),
        })
        .strict(),
    ),
    expected_solve_time_seconds: bandInt,
    question_archetype: z
      .object({
        archetype_id: nonEmptyTrimmed,
        version: z.string().max(50),
        label: nonEmptyTrimmed,
      })
      .strict(),
    mutable_surface_notes: z.string().max(2000).optional(),
    dimension_evidence: z.array(fingerprintDimensionEvidence).optional(),
  })
  .strict();

export type PedagogicalFingerprint = z.infer<typeof pedagogicalFingerprintSchema>;

/** Core invariant dimensions — W2 partial enforcement on mutation plans. */
export const CORE_INVARIANT_ASSERTION_DIMENSIONS = [
  "measured_skill",
  "cognitive_operation",
  "reasoning_pattern",
  "solution_skeleton",
  "critical_signal",
  "distractor_mechanisms",
] as const;

export const INVARIANT_FIELD_KEYS = new Set([
  "measured_skill",
  "learning_objective",
  "cognitive_operation",
  "reasoning_pattern",
  "solution_skeleton",
  "critical_signal",
  "hidden_constraint",
  "reasoning_steps",
  "information_order",
  "calculation_burden",
  "language_burden",
  "visual_reasoning_burden",
  "distractor_mechanisms",
  "misconception_targets",
  "trap_types",
  "elimination_opportunities",
  "difficulty_factors",
  "expected_solve_time_seconds",
  "question_archetype",
]);

export const MUTABLE_FIELD_KEYS = new Set(["mutable_surface_notes"]);
