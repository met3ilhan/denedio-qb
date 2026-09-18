import {
  defaultGeminiModelId,
  extractJsonObject,
  geminiGenerateTextJson,
  requireLiveMode,
} from "../gemini-client";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { normalizeGeminiDistractorPayload } from "./normalize-gemini-distractor";
import type { IDistractorAnalysisProvider } from "./types";

/** Live Gemini distractor analysis for generated candidate wrong options. */
export class GeminiDistractorAnalysisProvider implements IDistractorAnalysisProvider {
  readonly providerId = "gemini";
  readonly modelId = defaultGeminiModelId();

  constructor(private readonly apiKey: string) {}

  async analyze(input: Parameters<IDistractorAnalysisProvider["analyze"]>[0]) {
    requireLiveMode("GeminiDistractorAnalysisProvider");
    const started = Date.now();

    const prompt =
      "You are a distractor analyst for Turkish multiple-choice exams. " +
      "For each WRONG choice in the generated question, explain the pedagogical trap. " +
      "Return ONLY valid JSON matching distractor analysis: " +
      `{ schemaVersion: "${SCHEMA_VERSION}", wrong_choices: [{ choice_label, mechanism_id (MECH_*), misconception_id, trap_type_ids (TRAP_* array), ` +
      "steps: [{order 1-3, student_action}], produces_value (the choice text or numeric outcome), optional validator_note }], " +
      "all_mechanisms_from_fingerprint: boolean, decorative_distractor_flags: [] }. " +
      "For history/verbal: do NOT invent arithmetic error paths; use reading/concept/causality traps. " +
      "For quantitative: tie produces_value to a deterministic mistake path. " +
      "Avoid generic filler like 'öğrenci hata yapabilir'. " +
      "Mutation plan distractor_regeneration:\n" +
      JSON.stringify(input.plan.distractor_regeneration) +
      "\n\nQuestion:\n" +
      JSON.stringify({
        stem: input.question.stem.questionText,
        choices: input.question.choices.map((c) => ({
          label: c.label,
          text: c.text,
          isCorrect: c.isCorrect,
        })),
      });

    const text = await geminiGenerateTextJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel: "Gemini distractor analyst",
    });

    const parsed = extractJsonObject(text, "Gemini distractor analyst");
    const output = normalizeGeminiDistractorPayload(parsed, input.question, input.candidateId);

    return {
      output,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        latencyMs: Date.now() - started,
      },
    };
  }
}
