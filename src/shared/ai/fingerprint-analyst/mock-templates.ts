import type { SourceExtraction } from "@/shared/validation/source-extraction";
import {
  type PedagogicalFingerprint,
  pedagogicalFingerprintSchema,
} from "@/shared/validation/pedagogical-fingerprint";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import type { FingerprintEvidenceRow } from "./types";

type TemplateDraft = {
  payload: PedagogicalFingerprint;
  evidenceRows: FingerprintEvidenceRow[];
  gapWarnings: string[];
};

function baseEvidence(
  extraction: SourceExtraction,
  stemBlock: SourceExtraction["blocks"][number] | undefined,
  solutionBlock: SourceExtraction["blocks"][number] | undefined,
): Pick<TemplateDraft, "evidenceRows" | "gapWarnings"> {
  const wrongChoices = extraction.choices.filter((c) => !c.isCorrect);
  const gapWarnings: string[] = [];
  if (!solutionBlock?.text) {
    gapWarnings.push("Çözüm metni yok — çözüm iskeleti kanıtı kısmen çıkarımsaldır.");
  }
  if (wrongChoices.length < 2) {
    gapWarnings.push("İki veya daha az yanlış seçenek — çeldirici kapsamı sınırlı olabilir.");
  }

  const evidenceRows: FingerprintEvidenceRow[] = [
    {
      dimensionKey: "measured_skill",
      evidenceType: "source_anchor",
      pointer: { sourceBlockId: stemBlock?.blockId, page: stemBlock?.page ?? 1 },
      excerpt: extraction.stemText.slice(0, 500),
    },
  ];
  if (solutionBlock) {
    evidenceRows.push({
      dimensionKey: "solution_skeleton",
      evidenceType: "solution_trace",
      pointer: { sourceBlockId: solutionBlock.blockId },
      excerpt: solutionBlock.text?.slice(0, 500) ?? "",
    });
  }
  return { evidenceRows, gapWarnings };
}

function distractorRows(extraction: SourceExtraction, historyMode: boolean) {
  const wrongChoices = extraction.choices.filter((c) => !c.isCorrect);
  return wrongChoices.map((choice, index) => ({
    slot: choice.label,
    mechanism_id: historyMode ? "MECH_CONCEPT_SWAP" : index % 2 === 0 ? "MECH_PARTIAL" : "MECH_ARITH",
    trap_type_ids: [historyMode ? "TRAP_CONCEPT_SWAP" : "TRAP_PARTIAL"],
    misconception_id: historyMode
      ? `misc_chronology_or_context_${choice.label.toLowerCase()}`
      : `misc_partial_sum_${choice.label.toLowerCase()}`,
    summary: historyMode
      ? `Öğrenci ${choice.label} seçeneğinde kronoloji veya bağlam ipucunu yanlış eşleştirir.`
      : `Öğrenci ${choice.label} için aralık sayımını veya taban ücreti eksik uygular.`,
  }));
}

export function buildPiecewiseMathFingerprintDraft(
  extraction: SourceExtraction,
  sourceQuestionId: string,
): TemplateDraft {
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
    distractor_mechanisms: distractorRows(extraction, false),
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
    mutable_surface_notes:
      "Context, names, and coin values may change; interval structure must remain.",
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

  return { payload, ...baseEvidence(extraction, stemBlock, solutionBlock) };
}

export function buildHistoryFingerprintDraft(
  extraction: SourceExtraction,
  sourceQuestionId: string,
): TemplateDraft {
  const stemBlock = extraction.blocks.find((b) => b.type === "stem") ?? extraction.blocks[0];
  const solutionBlock = extraction.blocks.find((b) => b.type === "solution");
  const wrongChoices = extraction.choices.filter((c) => !c.isCorrect);
  const stemSnippet = extraction.stemText.slice(0, 160);

  const payload: PedagogicalFingerprint = pedagogicalFingerprintSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionId,
    measured_skill: "Select or infer the historically correct fact using stem context and options",
    learning_objective:
      "Connect period, actor, or event cues in the stem to the defensible historical answer",
    cognitive_operation: "infer",
    reasoning_pattern: "context_then_fact_selection",
    solution_skeleton: [
      {
        phase_id: "read",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Parse chronology, geography, and actor cues in the stem",
      },
      {
        phase_id: "eliminate",
        operation_type: "eliminate",
        depends_on: ["read"],
        critical_substep: true,
        description: "Eliminate options inconsistent with period or causal order",
      },
      {
        phase_id: "confirm",
        operation_type: "verify",
        depends_on: ["eliminate"],
        critical_substep: false,
        description: "Confirm remaining option against explicit stem constraints",
      },
    ],
    critical_signal: {
      role: "Temporal or contextual anchor that rules out at least one distractor",
      surface_form_notes: stemSnippet,
    },
    hidden_constraint: "Options must stay within the same historical frame implied by the stem",
    reasoning_steps: { min: 2, max: 4 },
    information_order: "Stem context before option comparison; avoid importing outside-era facts",
    calculation_burden: "none",
    language_burden: "medium",
    visual_reasoning_burden: "none",
    distractor_mechanisms: distractorRows(extraction, true),
    misconception_targets: wrongChoices.map(
      (c) => `Confuses period, cause, or actor associated with choice ${c.label}`,
    ),
    trap_types: ["TRAP_CONCEPT_SWAP", "TRAP_RED_HERRING"],
    elimination_opportunities: ["Reject options from wrong century or incompatible reform phase"],
    difficulty_factors: [{ factor: "context_density", weight: "primary" }],
    expected_solve_time_seconds: { min: 45, max: 120 },
    question_archetype: {
      archetype_id: "AR_HISTORY_CONTEXT_FACT",
      version: "1",
      label: "Context-bound historical fact selection",
    },
    mutable_surface_notes:
      "Names, dates, and setting may change; mechanism stays context-then-elimination among parallel facts.",
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

  return { payload, ...baseEvidence(extraction, stemBlock, solutionBlock) };
}

export function buildGenericFingerprintDraft(
  extraction: SourceExtraction,
  sourceQuestionId: string,
): TemplateDraft {
  const stemBlock = extraction.blocks.find((b) => b.type === "stem") ?? extraction.blocks[0];
  const solutionBlock = extraction.blocks.find((b) => b.type === "solution");
  const skillFromStem =
    extraction.stemText.length > 20
      ? `Apply reasoning required by: ${extraction.stemText.slice(0, 120).trim()}…`
      : "Apply domain reasoning implied by the source stem";

  const payload: PedagogicalFingerprint = pedagogicalFingerprintSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionId,
    measured_skill: skillFromStem,
    learning_objective: "Demonstrate the skill measured by the source question stem",
    cognitive_operation: "apply",
    reasoning_pattern: "stem_guided_reasoning",
    solution_skeleton: [
      {
        phase_id: "parse",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Extract givens and goal from the stem",
      },
      {
        phase_id: "solve",
        operation_type: "infer",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Execute domain-appropriate reasoning toward one defensible option",
      },
    ],
    critical_signal: {
      role: "Stem cue that determines which option family remains viable",
      surface_form_notes: stemBlock?.text?.slice(0, 120),
    },
    hidden_constraint: "Correct option must follow from stem-visible constraints only",
    reasoning_steps: { min: 2, max: 5 },
    information_order: "Stem constraints before option scan",
    calculation_burden: "light_mental",
    language_burden: "medium",
    visual_reasoning_burden: "none",
    distractor_mechanisms: distractorRows(extraction, false),
    misconception_targets: extraction.choices
      .filter((c) => !c.isCorrect)
      .map((c) => `Misapplies stem constraint when selecting ${c.label}`),
    trap_types: ["TRAP_PARTIAL"],
    elimination_opportunities: ["Reject options contradicting explicit stem facts"],
    difficulty_factors: [{ factor: "stem_load", weight: "primary" }],
    expected_solve_time_seconds: { min: 45, max: 150 },
    question_archetype: {
      archetype_id: "AR_SOURCE_ALIGNED",
      version: "1",
      label: "Source-aligned reasoning item",
    },
    mutable_surface_notes: "Surface nouns and numbers may change; stem-measured skill must remain.",
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

  return { payload, ...baseEvidence(extraction, stemBlock, solutionBlock) };
}
