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

  const invariant_assertions = Array.isArray(rec.invariant_assertions)
    ? rec.invariant_assertions.map((a) => {
        const row =
          typeof a === "object" && a !== null ? (a as Record<string, unknown>) : ({} as Record<string, unknown>);
        return {
          dimension: asString(row.dimension, "measured_skill"),
          assertion: asString(row.assertion, "Preserved per locked fingerprint"),
          expected: asString(row.expected, "Structural class unchanged vs locked fingerprint"),
        };
      })
    : CORE_INVARIANT_ASSERTION_DIMENSIONS.map((dimension) => ({
        dimension,
        assertion: `${dimension} preserved per locked fingerprint`,
        expected: `${dimension} class unchanged vs locked fingerprint`,
      }));

  const distractor_regeneration = Array.isArray(rec.distractor_regeneration)
    ? rec.distractor_regeneration
    : fingerprint.distractor_mechanisms.map((d) => ({
        choice_slot: d.slot,
        mechanism_id: d.mechanism_id,
        misconception_id: d.misconception_id,
        parameter_notes: `Regenerate distractor for slot ${d.slot} using ${d.mechanism_id}`,
      }));

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    fingerprint_ref: fingerprintVersionId,
    surface_mutations,
    invariant_assertions,
    operand_constraints: asString(
      rec.operand_constraints,
      "Preserve difficulty band and cognitive steps; avoid copying source operands verbatim",
    ),
    distractor_regeneration,
    anti_copy_notes: asString(
      rec.anti_copy_notes,
      "Do not reuse source proper nouns or distinctive phrasing; keep pedagogical mechanism",
    ),
  };

  return mutationPlanSchema.parse(candidate);
}
