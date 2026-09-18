import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";

export type DraftPatch = {
  stemText?: string;
  choices?: GeneratedQuestion["choices"];
  solutionText?: string;
  metadata?: GeneratedQuestion["metadata"];
  distractorAnalysis?: DistractorAnalysis | null;
};

export function shouldInvalidateVerification(
  current: GeneratedQuestion,
  patch: DraftPatch,
  distractorChanged: boolean,
): boolean {
  if (distractorChanged) return true;

  if (patch.stemText !== undefined && patch.stemText.trim() !== current.stem.questionText.trim()) {
    return true;
  }

  if (patch.solutionText !== undefined && patch.solutionText.trim() !== current.solution.solutionText.trim()) {
    return true;
  }

  if (patch.choices !== undefined && choicesMeaningfullyChanged(current.choices, patch.choices)) {
    return true;
  }

  if (patch.metadata !== undefined && metadataMeaningfullyChanged(current.metadata, patch.metadata)) {
    return true;
  }

  return false;
}

function choicesMeaningfullyChanged(
  before: GeneratedQuestion["choices"],
  after: GeneratedQuestion["choices"],
) {
  if (before.length !== after.length) return true;
  for (let i = 0; i < before.length; i++) {
    const a = before[i];
    const b = after[i];
    if (a.label !== b.label || a.isCorrect !== b.isCorrect || a.text.trim() !== b.text.trim()) {
      return true;
    }
    if ((a.mechanism_id ?? "") !== (b.mechanism_id ?? "")) return true;
    if ((a.misconception_id ?? "") !== (b.misconception_id ?? "")) return true;
  }
  return false;
}

function metadataMeaningfullyChanged(
  before: GeneratedQuestion["metadata"] | undefined,
  after: GeneratedQuestion["metadata"] | undefined,
) {
  const b = before ?? {};
  const a = after ?? {};
  const keys = [
    "criticalClue",
    "idealApproach",
    "commonMistake",
    "strategyExplanation",
    "difficulty",
    "expectedSolveTimeSeconds",
  ] as const;
  for (const key of keys) {
    if ((b[key] ?? null) !== (a[key] ?? null)) return true;
  }
  return false;
}
