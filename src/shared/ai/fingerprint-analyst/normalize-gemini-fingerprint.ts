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

function asSpecificString(value: unknown, fallback: string): string {
  const text = asNonEmptyString(value, "");
  if (!text || /^(NOT_ANALYZED|Source-aligned item|Key cue in the stem)$/i.test(text)) {
    return fallback;
  }
  return text;
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
      description: `Soru kökünü oku ve istenen tarihsel belge işlevini belirle: ${stemSnippet.slice(0, 120)}`,
    },
    {
      phase_id: "infer_answer",
      operation_type: "infer" as const,
      depends_on: ["parse_stem"],
      critical_substep: true,
      description: "Belgenin işlevini tarih bilgisiyle eşleştir ve uyuşmayan seçenekleri ele",
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
      description: normalizeSolutionDescription(
        asNonEmptyString(row.description, "NOT_ANALYZED"),
        stemSnippet,
        index,
      ).slice(0, 500),
    };
  });
}

function normalizeSolutionDescription(value: string, stemSnippet: string, index: number): string {
  if (/read stem|apply domain knowledge|reasoning phase aligned|source stem/i.test(value)) {
    return index === 0
      ? `Soru kökünü oku ve istenen tarihsel belge işlevini belirle: ${stemSnippet.slice(0, 120)}`
      : "Belgenin işlevini tarih bilgisiyle eşleştir ve uyuşmayan seçenekleri ele";
  }
  return value;
}

function historyFallbacks(extraction: SourceExtraction) {
  if (isHistoryConceptQuestion(extraction)) {
    return {
      signalRole: "Yerel yöneticilerin haksızlıklarını giderme ve kanuna aykırı uygulamaları düzeltme işlevi",
      archetypeId: "AR_HISTORICAL_CONCEPT_FUNCTION",
      archetypeLabel: "İşlev/tanım üzerinden tarihsel belge türü tanıma",
      informationOrder: "Soru kökü → ayırt edici işlev → seçeneklerde belge adı",
      difficultyFactor: "Belgenin ayırt edici yönetim ve hukuk işlevinin açıkça verilmesi",
      misconception: (label: string) => `${label} seçeneğini ilgili belge işleviyle karıştırma`,
      elimination: "Halkın haksızlığa uğramasını giderme işleviyle uyuşmayan belge türlerini ele",
    };
  }
  return {
    signalRole: "Soru kökündeki ayırt edici bilgi",
    archetypeId: "AR_SOURCE_ALIGNED",
    archetypeLabel: "Kaynak işleviyle uyumlu kavram tanıma",
    informationOrder: "Soru kökü → seçenekler",
    difficultyFactor: "Soru kökündeki ayırt edici ipucunun açıklığı",
    misconception: (label: string) => `${label} seçeneğiyle kavramı karıştırma`,
    elimination: "Soru köküyle uyuşmayan seçenekleri ele",
  };
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
    summary: `${wrong[index]?.label ?? "?"} seçeneğini ilgili belge işleviyle karıştırma`,
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
      summary: normalizeDistractorSummary(
        asNonEmptyString(row.summary, `${choice.label} seçeneğini ilgili belge işleviyle karıştırma`),
        choice.label,
      ).slice(0, 500),
    };
  });
}

function normalizeDistractorSummary(value: string, label: string): string {
  if (/^distractor mechanism for choice/i.test(value) || /^plausible confusion/i.test(value)) {
    return `${label} seçeneğini ilgili belge işleviyle karıştırma`;
  }
  return value;
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

function isHistoryConceptQuestion(extraction: SourceExtraction): boolean {
  const text = `${extraction.stemText} ${extraction.choices.map((choice) => choice.text).join(" ")}`.toLowerCase();
  return /osmanlı|padişah|adaletnâme|ahidnâme|amannâme|berat|ferman|belge|devlet/.test(text);
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
  const historyConceptQuestion = isHistoryConceptQuestion(extraction);
  const fallbacks = historyFallbacks(extraction);

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
          factor: asNonEmptyString(row.factor, fallbacks.difficultyFactor),
          weight: weightRaw === "secondary" ? ("secondary" as const) : ("primary" as const),
        };
      })
    : [{ factor: fallbacks.difficultyFactor, weight: "primary" as const }];

  const archetypeRec =
    typeof rec.question_archetype === "object" && rec.question_archetype !== null
      ? (rec.question_archetype as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionId,
    measured_skill: asNonEmptyString(rec.measured_skill, "NOT_ANALYZED"),
    learning_objective: asNonEmptyString(rec.learning_objective, "NOT_ANALYZED"),
    cognitive_operation: asNonEmptyString(
      rec.cognitive_operation,
      historyConceptQuestion ? "Kavramsal tanıma ve işlevsel eşleştirme" : "NOT_ANALYZED",
    ),
    reasoning_pattern: asNonEmptyString(rec.reasoning_pattern, "NOT_ANALYZED"),
    solution_skeleton: normalizeSolutionSkeleton(rec.solution_skeleton, stemSnippet),
    critical_signal:
      typeof rec.critical_signal === "object" && rec.critical_signal !== null
        ? {
            role: asSpecificString(
              (rec.critical_signal as Record<string, unknown>).role,
              fallbacks.signalRole,
            ),
            surface_form_notes: asNonEmptyString(
              (rec.critical_signal as Record<string, unknown>).surface_form_notes,
              stemBlock?.text?.slice(0, 200) ?? stemSnippet.slice(0, 200),
            ),
          }
        : {
            role: fallbacks.signalRole,
            surface_form_notes: stemBlock?.text?.slice(0, 200) ?? stemSnippet.slice(0, 200),
          },
    hidden_constraint: normalizeHiddenConstraint(rec.hidden_constraint),
    reasoning_steps: asBandInt(rec.reasoning_steps, { min: 2, max: 4 }),
    information_order: asNonEmptyString(rec.information_order, fallbacks.informationOrder),
    calculation_burden: coerceCalculationBurden(rec.calculation_burden),
    language_burden: coerceLanguageBurden(rec.language_burden),
    visual_reasoning_burden: coerceVisualBurden(rec.visual_reasoning_burden),
    distractor_mechanisms,
    misconception_targets: Array.isArray(rec.misconception_targets)
      ? rec.misconception_targets.map((t, i) =>
          asNonEmptyString(t, fallbacks.misconception(wrong[i]?.label ?? String(i + 1))),
        )
      : wrong.map((c) => fallbacks.misconception(c.label)),
    trap_types,
    elimination_opportunities: Array.isArray(rec.elimination_opportunities)
      ? rec.elimination_opportunities.map((t, i) => asNonEmptyString(t, `Elimination ${i + 1}`))
      : [fallbacks.elimination],
    difficulty_factors,
    expected_solve_time_seconds: asBandInt(
      rec.expected_solve_time_seconds,
      historyConceptQuestion ? { min: 20, max: 40 } : { min: 45, max: 120 },
    ),
    question_archetype: {
      archetype_id: asNonEmptyString(
        archetypeRec.archetype_id ?? archetypeRec.archetypeId,
        fallbacks.archetypeId,
      ),
      version: asNonEmptyString(archetypeRec.version, "1"),
      label: asSpecificString(archetypeRec.label, fallbacks.archetypeLabel),
    },
    mutable_surface_notes: asNonEmptyString(
      rec.mutable_surface_notes,
      "Surface wording and entities may change; measured mechanism must stay equivalent.",
    ),
  };

  return pedagogicalFingerprintSchema.parse(candidate);
}
