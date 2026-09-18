import type { SourceExtraction } from "@/shared/validation/source-extraction";
import {
  type PedagogicalFingerprint,
  pedagogicalFingerprintSchema,
} from "@/shared/validation/pedagogical-fingerprint";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

export type InferredFingerprintDraft = {
  payload: PedagogicalFingerprint;
  evidenceRows: Array<{
    dimensionKey: string;
    evidenceType: string;
    pointer: Record<string, unknown>;
    excerpt: string;
  }>;
  gapWarnings: string[];
};

/**
 * Deterministic mock inference from structured source (no LLM in Gate 3 baseline).
 */
export function inferFingerprintDraftFromExtraction(
  extraction: SourceExtraction,
  sourceQuestionId: string,
): InferredFingerprintDraft {
  const stemBlock = extraction.blocks.find((b) => b.type === "stem") ?? extraction.blocks[0];
  const solutionBlock = extraction.blocks.find((b) => b.type === "solution");

  const wrongChoices = extraction.choices.filter((c) => !c.isCorrect);

  const payload: PedagogicalFingerprint = pedagogicalFingerprintSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionId,
    measured_skill: "Apply piecewise rate structure to total cost",
    learning_objective: "Translate multi-part pricing language into a bounded arithmetic model",
    cognitive_operation: "apply",
    reasoning_pattern: "decompose_intervals_then_aggregate",
    solution_skeleton: [
      {
        phase_id: "parse",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Identify first-interval vs additional-interval pricing rule",
      },
      {
        phase_id: "model",
        operation_type: "model",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Map rental duration to count of additional intervals",
      },
      {
        phase_id: "compute",
        operation_type: "compute",
        depends_on: ["model"],
        critical_substep: false,
        description: "Sum base interval charge and scaled additional charges",
      },
      {
        phase_id: "verify",
        operation_type: "verify",
        depends_on: ["compute"],
        critical_substep: false,
        description: "Check total against distractor-producing partial sums",
      },
    ],
    critical_signal: {
      role: "Distinguish first hour from each additional hour in the pricing rule",
      surface_form_notes: stemBlock?.text?.slice(0, 120),
    },
    hidden_constraint: "Additional-hour rate applies only after the first hour boundary",
    reasoning_steps: { min: 3, max: 4 },
    information_order: "Pricing rule precedes duration; student must not treat all hours uniformly",
    calculation_burden: "light_mental",
    language_burden: "medium",
    visual_reasoning_burden: "none",
    distractor_mechanisms: wrongChoices.map((choice, index) => ({
      slot: choice.label,
      mechanism_id: index % 2 === 0 ? "MECH_PARTIAL" : "MECH_ARITH",
      trap_type_ids: index % 2 === 0 ? ["TRAP_PARTIAL"] : ["TRAP_PARTIAL"],
      misconception_id: `misc_partial_sum_${choice.label.toLowerCase()}`,
      summary: `Student stops after partial interval accounting for choice ${choice.label}`,
    })),
    misconception_targets: wrongChoices.map(
      (c) => `Treats interval count or base fee incorrectly for ${c.label}`,
    ),
    trap_types: ["TRAP_PARTIAL"],
    elimination_opportunities: ["Reject totals below first-interval fee alone"],
    difficulty_factors: [{ factor: "multi_constraint", weight: "primary" }],
    expected_solve_time_seconds: { min: 60, max: 120 },
    question_archetype: {
      archetype_id: "AR_RATE_PIECEWISE",
      version: "1",
      label: "Piecewise hourly rate total",
    },
    mutable_surface_notes: "Context, names, and coin values may change; interval structure must remain.",
    dimension_evidence: [
      {
        dimensionKey: "measured_skill",
        verdict: "UNVERIFIED",
        evidence: [
          {
            excerpt: extraction.stemText.slice(0, 240),
            sourceBlockId: stemBlock?.blockId,
            page: stemBlock?.page,
          },
        ],
      },
    ],
  });

  const evidenceRows = [
    {
      dimensionKey: "measured_skill",
      evidenceType: "source_anchor",
      pointer: { sourceBlockId: stemBlock?.blockId, page: stemBlock?.page ?? 1 },
      excerpt: extraction.stemText.slice(0, 500),
    },
    ...(solutionBlock
      ? [
          {
            dimensionKey: "solution_skeleton",
            evidenceType: "solution_trace",
            pointer: { sourceBlockId: solutionBlock.blockId },
            excerpt: solutionBlock.text?.slice(0, 500) ?? "",
          },
        ]
      : []),
  ];

  const gapWarnings: string[] = [];
  if (!solutionBlock?.text) {
    gapWarnings.push("No solution block — solution skeleton evidence is inferred only.");
  }
  if (wrongChoices.length < 2) {
    gapWarnings.push("Fewer than two wrong choices — distractor mechanism coverage may be thin.");
  }

  return { payload, evidenceRows, gapWarnings };
}
