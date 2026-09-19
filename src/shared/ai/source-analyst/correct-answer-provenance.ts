import type { CorrectAnswerProvenance } from "../pedagogy-display";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

export function resolveCorrectAnswerProvenance(extraction: SourceExtraction): CorrectAnswerProvenance {
  const warnings = extraction.extractionWarnings ?? [];
  const hasVisible =
    warnings.some((w) => /visible|marked|kaynakta.*işaret/i.test(w)) ||
    warnings.some((w) => w === "correct_answer_visible_in_source");
  const hasNotVisible = warnings.some((w) => w === "correct_answer_not_visible_in_source");
  const marked = extraction.choices.some((c) => c.isCorrect);

  if (!marked) {
    return "unset";
  }
  if (hasVisible && !hasNotVisible) {
    return "visible_in_source";
  }
  if (hasNotVisible) {
    return "ai_inferred";
  }
  return "ai_inferred";
}
