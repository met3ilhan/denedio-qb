import {
  asNonEmptyString,
  coerceBoolean,
  coerceMechanismId,
  coerceOperationType,
  coerceStringArray,
  coerceTrapTypeId,
  coerceTrapTypeIdList,
  NOT_APPLICABLE_HIDDEN_CONSTRAINT,
} from "../gemini-pedagogy-coerce";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

function asBandInt(value: unknown, fallback: { min: number; max: number }) {
  if (typeof value !== "object" || value === null) {
    return fallback;
  }
  const rec = value as Record<string, unknown>;
  const min = typeof rec.min === "number" ? rec.min : Number(rec.min);
  const max = typeof rec.max === "number" ? rec.max : Number(rec.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
    return { min: Math.trunc(min), max: Math.trunc(max) };
  }
  return fallback;
}

function coerceCalculationBurden(
  value: unknown,
): PedagogicalFingerprint["calculation_burden"] {
  const raw = asNonEmptyString(value, "none").toLowerCase();
  const allowed = [
    "none",
    "light_mental",
    "multi_step_numeric",
    "symbolic",
    "calculator_expected",
  ] as const;
  if ((allowed as readonly string[]).includes(raw)) {
    return raw as PedagogicalFingerprint["calculation_burden"];
  }
  if (raw.includes("calc") || raw.includes("numeric")) {
    return "multi_step_numeric";
  }
  return "none";
}

function coerceLanguageBurden(value: unknown): PedagogicalFingerprint["language_burden"] {
  const raw = asNonEmptyString(value, "medium").toLowerCase();
  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }
  return "medium";
}

function coerceVisualBurden(
  value: unknown,
): PedagogicalFingerprint["visual_reasoning_burden"] {
  const raw = asNonEmptyString(value, "none").toLowerCase();
  const allowed = [
    "none",
    "decode_diagram",
    "spatial_transform",
    "graph_read",
    "table_cross_reference",
    "combined",
  ] as const;
  if ((allowed as readonly string[]).includes(raw)) {
    return raw as PedagogicalFingerprint["visual_reasoning_burden"];
  }
  return "none";
}

function defaultSolutionSkeleton(stemSnippet: string) {
  return [
    {
      phase_id: "parse_stem",
      operation_type: "parse" as const,
      depends_on: [] as string[],
      critical_substep: true,
      description: `Read stem and identify the task: ${stemSnippet.slice(0, 120)}`,
    },
    {
      phase_id: "infer_answer",
      operation_type: "infer" as const,
      depends_on: ["parse_stem"],
      critical_substep: true,
      description: "Apply domain knowledge and eliminate inconsistent options",
    },
  ];
}

function normalizeSolutionSkeleton(raw: unknown, stemSnippet: string) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultSolutionSkeleton(stemSnippet);
  }

  return raw.map((entry, index) => {
    const row =
      typeof entry === "object" && entry !== null
        ? (entry as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    const phase_id = asNonEmptyString(row.phase_id ?? row.phaseId ?? `phase_${index + 1}`, `phase_${index + 1}`);
    return {
      phase_id,
      operation_type: coerceOperationType(row.operation_type ?? row.operationType, index === 0 ? "parse" : "infer"),
      depends_on: coerceStringArray(row.depends_on ?? row.dependsOn),
      critical_substep: coerceBoolean(row.critical_substep ?? row.criticalSubstep, index === 0),
      description: asNonEmptyString(row.description, "Reasoning phase aligned to source stem").slice(0, 500),
    };
  });
}

function normalizeDistractorMechanisms(
  raw: unknown,
  wrong: SourceExtraction["choices"],
) {
  const fallbackForIndex = (index: number) => ({
    slot: wrong[index]?.label ?? String.fromCharCode(65 + index),
    mechanism_id: index % 2 === 0 ? ("MECH_CONCEPT_SWAP" as const) : ("MECH_READ" as const),
    trap_type_ids: ["TRAP_CONCEPT_SWAP" as const],
    misconception_id: `misc_${(wrong[index]?.label ?? "x").toLowerCase()}`,
    summary: `Plausible confusion leading to choice ${wrong[index]?.label ?? "?"}`,
  });

  if (!Array.isArray(raw) || raw.length === 0) {
    return wrong.map((_, index) => fallbackForIndex(index));
  }

  return wrong.map((choice, index) => {
    const match =
      raw.find((entry) => {
        const row =
          typeof entry === "object" && entry !== null
            ? (entry as Record<string, unknown>)
            : ({} as Record<string, unknown>);
        return asNonEmptyString(row.slot, "").toUpperCase() === choice.label;
      }) ?? raw[index];

    const row =
      typeof match === "object" && match !== null
        ? (match as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    const trap_type_ids = coerceTrapTypeIdList(row.trap_type_ids ?? row.trapTypeIds, "TRAP_CONCEPT_SWAP");

    return {
      slot: choice.label,
      mechanism_id: coerceMechanismId(row.mechanism_id ?? row.mechanismId, index % 2 === 0 ? "MECH_CONCEPT_SWAP" : "MECH_READ"),
      trap_type_ids,
      misconception_id: asNonEmptyString(row.misconception_id ?? row.misconceptionId, `misc_${choice.label.toLowerCase()}`),
      summary: asNonEmptyString(row.summary, `Distractor mechanism for choice ${choice.label}`).slice(0, 500),
    };
  });
}

function normalizeTrapTypes(raw: unknown, mechanisms: Array<{ trap_type_ids: string[] }>) {
  const fromRaw = Array.isArray(raw)
    ? raw.map((entry) => coerceTrapTypeId(entry, "TRAP_CONCEPT_SWAP"))
    : [];
  const fromMechanisms = mechanisms.flatMap((m) => m.trap_type_ids.map((t) => coerceTrapTypeId(t, "TRAP_CONCEPT_SWAP")));
  const merged = [...new Set([...fromRaw, ...fromMechanisms])];
  return merged.length > 0 ? merged : (["TRAP_CONCEPT_SWAP"] as const);
}

function normalizeHiddenConstraint(raw: unknown): string {
  const text = asNonEmptyString(raw, "");
  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "none") {
    return NOT_APPLICABLE_HIDDEN_CONSTRAINT;
  }
  if (text.toLowerCase().startsWith("not_applicable")) {
    return text;
  }
  return text;
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
  const stemSnippet = extraction.stemText || stemBlock?.text || "source stem";

  const distractor_mechanisms = normalizeDistractorMechanisms(rec.distractor_mechanisms, wrong);
  const trap_types = normalizeTrapTypes(rec.trap_types, distractor_mechanisms);

  const difficulty_factors = Array.isArray(rec.difficulty_factors)
    ? rec.difficulty_factors.map((entry, index) => {
        const row =
          typeof entry === "object" && entry !== null
            ? (entry as Record<string, unknown>)
            : ({} as Record<string, unknown>);
        const weightRaw = asNonEmptyString(row.weight, index === 0 ? "primary" : "secondary").toLowerCase();
        return {
          factor: asNonEmptyString(row.factor, `factor_${index + 1}`),
          weight: weightRaw === "secondary" ? ("secondary" as const) : ("primary" as const),
        };
      })
    : [{ factor: "stem_load", weight: "primary" as const }];

  const archetypeRec =
    typeof rec.question_archetype === "object" && rec.question_archetype !== null
      ? (rec.question_archetype as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionId,
    measured_skill: asNonEmptyString(rec.measured_skill, "Skill derived from source stem"),
    learning_objective: asNonEmptyString(rec.learning_objective, "Learning objective aligned to source stem"),
    cognitive_operation: asNonEmptyString(rec.cognitive_operation, "recall_and_apply"),
    reasoning_pattern: asNonEmptyString(rec.reasoning_pattern, "stem_guided_reasoning"),
    solution_skeleton: normalizeSolutionSkeleton(rec.solution_skeleton, stemSnippet),
    critical_signal:
      typeof rec.critical_signal === "object" && rec.critical_signal !== null
        ? {
            role: asNonEmptyString(
              (rec.critical_signal as Record<string, unknown>).role,
              "Key cue in the stem",
            ),
            surface_form_notes: asNonEmptyString(
              (rec.critical_signal as Record<string, unknown>).surface_form_notes,
              stemBlock?.text?.slice(0, 200) ?? stemSnippet.slice(0, 200),
            ),
          }
        : {
            role: "Key cue in the stem",
            surface_form_notes: stemBlock?.text?.slice(0, 200) ?? stemSnippet.slice(0, 200),
          },
    hidden_constraint: normalizeHiddenConstraint(rec.hidden_constraint),
    reasoning_steps: asBandInt(rec.reasoning_steps, { min: 2, max: 4 }),
    information_order: asNonEmptyString(rec.information_order, "Stem before options"),
    calculation_burden: coerceCalculationBurden(rec.calculation_burden),
    language_burden: coerceLanguageBurden(rec.language_burden),
    visual_reasoning_burden: coerceVisualBurden(rec.visual_reasoning_burden),
    distractor_mechanisms,
    misconception_targets: Array.isArray(rec.misconception_targets)
      ? rec.misconception_targets.map((t, i) => asNonEmptyString(t, `Misconception ${i + 1}`))
      : wrong.map((c) => `Misconception for ${c.label}`),
    trap_types,
    elimination_opportunities: Array.isArray(rec.elimination_opportunities)
      ? rec.elimination_opportunities.map((t, i) => asNonEmptyString(t, `Elimination ${i + 1}`))
      : ["Eliminate options contradicting stem-visible facts"],
    difficulty_factors,
    expected_solve_time_seconds: asBandInt(rec.expected_solve_time_seconds, { min: 45, max: 120 }),
    question_archetype: {
      archetype_id: asNonEmptyString(archetypeRec.archetype_id ?? archetypeRec.archetypeId, "AR_SOURCE_ALIGNED"),
      version: asNonEmptyString(archetypeRec.version, "1"),
      label: asNonEmptyString(archetypeRec.label, "Source-aligned item"),
    },
    mutable_surface_notes: asNonEmptyString(
      rec.mutable_surface_notes,
      "Surface wording and entities may change; measured mechanism must stay equivalent.",
    ),
  };

  return pedagogicalFingerprintSchema.parse(candidate);
}
