import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import {
  sourcePedagogicalClassificationSchema,
  type SourcePedagogicalClassification,
} from "@/shared/validation/source-pedagogical-classification";

import { asNonEmptyString } from "../gemini-pedagogy-coerce";

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

export function normalizeClassificationPayload(raw: unknown): SourcePedagogicalClassification | undefined {
  const rec =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : undefined;
  if (!rec) {
    return undefined;
  }

  const nested =
    typeof rec.classification === "object" && rec.classification !== null
      ? (rec.classification as Record<string, unknown>)
      : rec;

  const subject = asNonEmptyString(nested.subject ?? nested.ders, "");
  if (!subject || subject === "NOT_ANALYZED") {
    return undefined;
  }

  const difficultyRaw = asNonEmptyString(nested.difficulty ?? nested.zorluk, "").toUpperCase();
  const difficulty =
    difficultyRaw === "EASY" || difficultyRaw === "MEDIUM" || difficultyRaw === "HARD"
      ? difficultyRaw
      : undefined;

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    subject,
    topic: asNonEmptyString(nested.topic ?? nested.konu, "") || undefined,
    subtopic: asNonEmptyString(nested.subtopic ?? nested.alt_konu ?? nested.altKonu, "") || undefined,
    question_type: asNonEmptyString(nested.question_type ?? nested.questionType ?? nested.soru_turu, "") || undefined,
    difficulty,
    expected_solve_time_seconds: asBandInt(
      nested.expected_solve_time_seconds ?? nested.expectedSolveTimeSeconds,
      { min: 20, max: 45 },
    ),
    difficulty_rationale:
      asNonEmptyString(nested.difficulty_rationale ?? nested.difficultyRationale, "") || undefined,
  };

  return sourcePedagogicalClassificationSchema.parse(candidate);
}
