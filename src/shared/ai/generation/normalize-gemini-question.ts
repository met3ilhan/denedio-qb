import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { GenerationStageContext } from "./types";

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function normalizeChoiceLabel(raw: unknown, index: number): string {
  const labels = ["A", "B", "C", "D", "E"];
  if (typeof raw === "string" && labels.includes(raw.trim().toUpperCase())) {
    return raw.trim().toUpperCase();
  }
  return labels[index] ?? "A";
}

/** Coerce Gemini JSON into strict GeneratedQuestion before Zod parse. */
export function normalizeGeminiQuestionPayload(
  raw: unknown,
  context: GenerationStageContext,
): GeneratedQuestion {
  const rec =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const stemRec =
    typeof rec.stem === "object" && rec.stem !== null
      ? (rec.stem as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const solutionRec =
    typeof rec.solution === "object" && rec.solution !== null
      ? (rec.solution as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const metaRec =
    typeof rec.metadata === "object" && rec.metadata !== null
      ? (rec.metadata as Record<string, unknown>)
      : undefined;

  const rawChoices = Array.isArray(rec.choices) ? rec.choices : [];
  const choices = rawChoices.slice(0, 5).map((item, index) => {
    const c =
      typeof item === "object" && item !== null ? (item as Record<string, unknown>) : ({} as Record<string, unknown>);
    const isCorrect =
      c.isCorrect === true ||
      c.isCorrect === "true" ||
      c.is_correct === true ||
      c.is_correct === "true";
    return {
      label: normalizeChoiceLabel(c.label, index),
      text: asString(c.text, `Choice ${index + 1}`),
      isCorrect,
    };
  });

  if (!choices.some((c) => c.isCorrect) && choices.length > 0) {
    choices[0] = { ...choices[0], isCorrect: true };
  }

  const difficultyRaw = metaRec?.difficulty;
  const difficulty =
    difficultyRaw === "EASY" || difficultyRaw === "MEDIUM" || difficultyRaw === "HARD"
      ? difficultyRaw
      : undefined;

  let expectedSolveTimeSeconds: number | undefined;
  const est = metaRec?.expectedSolveTimeSeconds ?? metaRec?.expected_solve_time_seconds;
  if (typeof est === "number" && Number.isFinite(est)) {
    expectedSolveTimeSeconds = Math.trunc(est);
  } else if (typeof est === "string" && est.trim()) {
    const n = Number(est);
    if (Number.isFinite(n)) expectedSolveTimeSeconds = Math.trunc(n);
  }
  if (expectedSolveTimeSeconds !== undefined && expectedSolveTimeSeconds < 10) {
    expectedSolveTimeSeconds = 10;
  }

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    stem: {
      questionText: asString(stemRec.questionText ?? rec.questionText ?? rec.stemText, "Generated question stem"),
    },
    choices,
    solution: {
      solutionText: asString(solutionRec.solutionText ?? rec.solutionText, "Solution summary required."),
    },
    metadata:
      difficulty || expectedSolveTimeSeconds
        ? {
            difficulty,
            expectedSolveTimeSeconds,
          }
        : undefined,
    provenance: {
      sourceQuestionId: context.sourceQuestionId,
      fingerprintVersionId: context.fingerprintVersionId,
      generationRunId: context.generationRunId,
      mutationPlanId: context.mutationPlanId,
    },
  };

  return generatedQuestionSchema.parse(candidate);
}
