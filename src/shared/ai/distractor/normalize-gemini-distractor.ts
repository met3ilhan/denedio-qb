import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import { wrongChoices } from "@/shared/validation/generated-question";
import { mechanismId, trapTypeId } from "@/shared/validation/pedagogy-enums";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

function coerceMechanism(raw: unknown): string {
  const parsed = mechanismId.safeParse(raw);
  return parsed.success ? parsed.data : "MECH_READ";
}

function coerceTrap(raw: unknown): string {
  const parsed = trapTypeId.safeParse(raw);
  return parsed.success ? parsed.data : "TRAP_READ";
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

export function normalizeGeminiDistractorPayload(
  raw: unknown,
  question: GeneratedQuestion,
  candidateId?: string,
): DistractorAnalysis {
  const rec =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const wrong = wrongChoices(question);
  const rawWrong = Array.isArray(rec.wrong_choices) ? rec.wrong_choices : [];

  const wrong_choices = wrong.map((choice, index) => {
    const match =
      rawWrong.find((w) => {
        const row =
          typeof w === "object" && w !== null ? (w as Record<string, unknown>) : ({} as Record<string, unknown>);
        return asString(row.choice_label, "").toUpperCase() === choice.label;
      }) ?? rawWrong[index];

    const row =
      typeof match === "object" && match !== null
        ? (match as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    const trapRaw = row.trap_type_ids;
    const trap_type_ids = Array.isArray(trapRaw)
      ? trapRaw.map((t) => coerceTrap(t))
      : [coerceTrap("TRAP_READ")];

    const stepsRaw = row.steps;
    const steps = Array.isArray(stepsRaw)
      ? stepsRaw.slice(0, 3).map((s, si) => {
          const step =
            typeof s === "object" && s !== null ? (s as Record<string, unknown>) : ({} as Record<string, unknown>);
          return {
            order: si + 1,
            student_action: asString(
              step.student_action,
              `Misapplied reasoning leading to ${choice.text}`,
            ),
          };
        })
      : [
          {
            order: 1,
            student_action: asString(
              row.student_action,
              `Misapplied reasoning leading to ${choice.text}`,
            ),
          },
        ];

    return {
      choice_label: choice.label,
      mechanism_id: coerceMechanism(row.mechanism_id),
      misconception_id: asString(row.misconception_id, `misc_${choice.label.toLowerCase()}`),
      trap_type_ids,
      steps,
      produces_value: asString(row.produces_value ?? row.producesValue, choice.text),
      validator_note: asString(row.why_attractive ?? row.whyAttractive, "").slice(0, 500) || undefined,
    };
  });

  return distractorAnalysisSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    candidateId,
    wrong_choices,
    all_mechanisms_from_fingerprint: rec.all_mechanisms_from_fingerprint !== false,
    decorative_distractor_flags: [],
  });
}
