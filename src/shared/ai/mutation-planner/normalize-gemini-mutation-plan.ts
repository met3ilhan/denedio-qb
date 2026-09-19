import { coerceMechanismId } from "../gemini-pedagogy-coerce";
import { CORE_INVARIANT_ASSERTION_DIMENSIONS } from "@/shared/validation/pedagogical-fingerprint";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

const SURFACE_DIMENSIONS = new Set([
  "context",
  "names",
  "numbers",
  "diagram_class",
  "wording_structure",
  "information_order_presentation",
  "choice_order",
]);

const INVARIANT_DIMENSION_ALIASES: Record<string, (typeof CORE_INVARIANT_ASSERTION_DIMENSIONS)[number]> = {
  measured_skill: "measured_skill",
  measuredskill: "measured_skill",
  cognitive_operation: "cognitive_operation",
  cognitiveoperation: "cognitive_operation",
  reasoning_pattern: "reasoning_pattern",
  reasoningpattern: "reasoning_pattern",
  solution_skeleton: "solution_skeleton",
  solutionskeleton: "solution_skeleton",
  critical_signal: "critical_signal",
  criticalsignal: "critical_signal",
  distractor_mechanisms: "distractor_mechanisms",
  distractormechanisms: "distractor_mechanisms",
};

function normalizeInvariantDimension(raw: unknown): (typeof CORE_INVARIANT_ASSERTION_DIMENSIONS)[number] {
  const token = asString(raw, "measured_skill")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const compact = token.replace(/_/g, "");
  if (INVARIANT_DIMENSION_ALIASES[token]) {
    return INVARIANT_DIMENSION_ALIASES[token];
  }
  if (INVARIANT_DIMENSION_ALIASES[compact]) {
    return INVARIANT_DIMENSION_ALIASES[compact];
  }
  if ((CORE_INVARIANT_ASSERTION_DIMENSIONS as readonly string[]).includes(token)) {
    return token as (typeof CORE_INVARIANT_ASSERTION_DIMENSIONS)[number];
  }
  return "measured_skill";
}

function mergeInvariantAssertions(raw: unknown) {
  const map = new Map<
    (typeof CORE_INVARIANT_ASSERTION_DIMENSIONS)[number],
    { dimension: string; assertion: string; expected: string }
  >();

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const row =
        typeof entry === "object" && entry !== null
          ? (entry as Record<string, unknown>)
          : ({} as Record<string, unknown>);
      const dimension = normalizeInvariantDimension(row.dimension);
      map.set(dimension, {
        dimension,
        assertion: asString(row.assertion, `${dimension} preserved per locked fingerprint`),
        expected: asString(row.expected, `${dimension} class unchanged vs locked fingerprint`),
      });
    }
  }

  for (const dimension of CORE_INVARIANT_ASSERTION_DIMENSIONS) {
    if (!map.has(dimension)) {
      map.set(dimension, {
        dimension,
        assertion: `${dimension} preserved per locked fingerprint`,
        expected: `${dimension} class unchanged vs locked fingerprint`,
      });
    }
  }

  return Array.from(map.values());
}

function normalizeChoiceSlot(raw: unknown, fallback: string): string {
  const label = asString(raw, fallback).toUpperCase().slice(0, 1);
  return /^[A-E]$/.test(label) ? label : fallback;
}

function normalizeDistractorRegeneration(
  raw: unknown,
  fingerprint: { distractor_mechanisms: Array<{ slot: string; mechanism_id: string; misconception_id: string }> },
) {
  const rawRows = Array.isArray(raw) ? raw : [];

  return fingerprint.distractor_mechanisms.map((slotMeta) => {
    const match =
      rawRows.find((entry) => {
        const row =
          typeof entry === "object" && entry !== null
            ? (entry as Record<string, unknown>)
            : ({} as Record<string, unknown>);
        const slot = normalizeChoiceSlot(row.choice_slot ?? row.slot, slotMeta.slot);
        return slot === slotMeta.slot;
      }) ?? rawRows.find((entry) => {
        const row =
          typeof entry === "object" && entry !== null
            ? (entry as Record<string, unknown>)
            : ({} as Record<string, unknown>);
        return normalizeChoiceSlot(row.choice_slot ?? row.slot, "") === slotMeta.slot;
      });

    const row =
      typeof match === "object" && match !== null
        ? (match as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    return {
      choice_slot: slotMeta.slot,
      mechanism_id: coerceMechanismId(row.mechanism_id, slotMeta.mechanism_id as Parameters<typeof coerceMechanismId>[1]),
      misconception_id: asString(row.misconception_id, slotMeta.misconception_id),
      parameter_notes: asString(
        row.parameter_notes,
        `Regenerate distractor for slot ${slotMeta.slot} using ${slotMeta.mechanism_id}`,
      ).slice(0, 1000),
    };
  });
}

/** Coerce Gemini mutation plan JSON before strict Zod parse. */
export function normalizeGeminiMutationPlanPayload(
  raw: unknown,
  fingerprintVersionId: string,
  fingerprint: { distractor_mechanisms: Array<{ slot: string; mechanism_id: string; misconception_id: string }> },
): MutationPlan {
  const rec =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const surface_mutations = Array.isArray(rec.surface_mutations)
    ? rec.surface_mutations.map((m) => {
        const row =
          typeof m === "object" && m !== null ? (m as Record<string, unknown>) : ({} as Record<string, unknown>);
        const dimRaw = asString(row.dimension, "context");
        const dimension = SURFACE_DIMENSIONS.has(dimRaw) ? dimRaw : "context";
        return {
          dimension,
          description: asString(row.description, "Surface change aligned to fingerprint mutable notes"),
        };
      })
    : [
        {
          dimension: "context" as const,
          description: "Reframe historical actors and setting while preserving reasoning mechanism",
        },
        {
          dimension: "wording_structure" as const,
          description: "Reorder clauses; avoid copying source sentence structure",
        },
      ];

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    fingerprint_ref: asString(rec.fingerprint_ref, fingerprintVersionId),
    surface_mutations,
    invariant_assertions: mergeInvariantAssertions(rec.invariant_assertions),
    operand_constraints: asString(
      rec.operand_constraints,
      "Preserve difficulty band and cognitive steps; avoid copying source operands verbatim",
    ),
    distractor_regeneration: normalizeDistractorRegeneration(rec.distractor_regeneration, fingerprint),
    anti_copy_notes: asString(
      rec.anti_copy_notes,
      "Do not reuse source proper nouns or distinctive phrasing; keep pedagogical mechanism",
    ),
  };

  return mutationPlanSchema.parse(candidate);
}
