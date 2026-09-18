import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function asBandInt(value: unknown, fallback: { min: number; max: number }) {
  if (typeof value !== "object" || value === null) return fallback;
  const rec = value as Record<string, unknown>;
  const min = typeof rec.min === "number" ? rec.min : Number(rec.min);
  const max = typeof rec.max === "number" ? rec.max : Number(rec.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
    return { min: Math.trunc(min), max: Math.trunc(max) };
  }
  return fallback;
}

/** Coerce Gemini JSON into strict PedagogicalFingerprint before Zod parse. */
export function normalizeGeminiFingerprintPayload(
  raw: unknown,
  extraction: SourceExtraction,
  sourceQuestionId: string,
): PedagogicalFingerprint {
  const rec =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const stemBlock = extraction.blocks.find((b) => b.type === "stem") ?? extraction.blocks[0];
  const wrong = extraction.choices.filter((c) => !c.isCorrect);

  const distractor_mechanisms = Array.isArray(rec.distractor_mechanisms)
    ? rec.distractor_mechanisms
    : wrong.map((choice, index) => ({
        slot: choice.label,
        mechanism_id: index % 2 === 0 ? "MECH_CONCEPT_SWAP" : "MECH_READ",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        misconception_id: `misc_${choice.label.toLowerCase()}`,
        summary: `Plausible confusion leading to choice ${choice.label}`,
      }));

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionId,
    measured_skill: asString(rec.measured_skill, "Skill derived from source stem"),
    learning_objective: asString(rec.learning_objective, "Learning objective aligned to source stem"),
    cognitive_operation: asString(rec.cognitive_operation, "apply"),
    reasoning_pattern: asString(rec.reasoning_pattern, "stem_guided_reasoning"),
    solution_skeleton: Array.isArray(rec.solution_skeleton)
      ? rec.solution_skeleton
      : [
          {
            phase_id: "parse",
            operation_type: "parse",
            depends_on: [],
            critical_substep: true,
            description: "Read stem constraints",
          },
        ],
    critical_signal:
      typeof rec.critical_signal === "object" && rec.critical_signal !== null
        ? rec.critical_signal
        : {
            role: asString(
              (rec.critical_signal as { role?: string } | undefined)?.role,
              "Key cue in the stem",
            ),
            surface_form_notes: stemBlock?.text?.slice(0, 200),
          },
    hidden_constraint: asString(rec.hidden_constraint, "Answer must follow from stem-visible facts"),
    reasoning_steps: asBandInt(rec.reasoning_steps, { min: 2, max: 4 }),
    information_order: asString(rec.information_order, "Stem before options"),
    calculation_burden: rec.calculation_burden ?? "none",
    language_burden: rec.language_burden ?? "medium",
    visual_reasoning_burden: rec.visual_reasoning_burden ?? "none",
    distractor_mechanisms,
    misconception_targets: Array.isArray(rec.misconception_targets)
      ? rec.misconception_targets
      : wrong.map((c) => `Misconception for ${c.label}`),
    trap_types: Array.isArray(rec.trap_types) ? rec.trap_types : ["TRAP_CONCEPT_SWAP"],
    elimination_opportunities: Array.isArray(rec.elimination_opportunities)
      ? rec.elimination_opportunities
      : ["Eliminate options contradicting stem"],
    difficulty_factors: Array.isArray(rec.difficulty_factors)
      ? rec.difficulty_factors
      : [{ factor: "stem_load", weight: "primary" }],
    expected_solve_time_seconds: asBandInt(rec.expected_solve_time_seconds, { min: 45, max: 120 }),
    question_archetype:
      typeof rec.question_archetype === "object" && rec.question_archetype !== null
        ? rec.question_archetype
        : {
            archetype_id: asString(
              (rec.question_archetype as { archetype_id?: string } | undefined)?.archetype_id,
              "AR_SOURCE_ALIGNED",
            ),
            version: "1",
            label: asString(
              (rec.question_archetype as { label?: string } | undefined)?.label,
              "Source-aligned item",
            ),
          },
    mutable_surface_notes: asString(
      rec.mutable_surface_notes,
      "Surface wording and entities may change; measured mechanism must stay equivalent.",
    ),
    dimension_evidence: Array.isArray(rec.dimension_evidence) ? rec.dimension_evidence : undefined,
  };

  return pedagogicalFingerprintSchema.parse(candidate);
}
