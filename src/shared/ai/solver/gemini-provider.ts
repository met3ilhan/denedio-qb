import {
  extractJsonObject,
  geminiGenerateTextJson,
  requireLiveMode,
  solverGeminiModelId,
} from "../gemini-client";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { solveFromStemOnly } from "./stem-solver";
import { normalizeGeminiSolverPayload } from "./normalize-gemini-solver";
import type { ISolverProvider, SolverInput } from "./types";

/**
 * Live independent solver — stem and choices only; never receives writer solution or correct flag.
 * Falls back to deterministic stem-solver only when Gemini returns empty label for quantitative stems.
 */
export class GeminiSolverProvider implements ISolverProvider {
  readonly providerId = "gemini";
  readonly modelId = solverGeminiModelId();
  readonly solverProfile = "independent" as const;

  constructor(private readonly apiKey: string) {}

  async solve(input: SolverInput) {
    requireLiveMode("GeminiSolverProvider");
    const started = Date.now();

    const prompt =
      "You are an independent exam solver. You receive ONLY the question stem and answer choices — " +
      "you do NOT know which choice the author marked correct. " +
      "Select the single best defensible answer, or null if ambiguous. " +
      "Return ONLY valid JSON: " +
      `{ schemaVersion: "${SCHEMA_VERSION}", selected_label: "A"|"B"|"C"|"D"|null, is_unique: boolean, ` +
      "ambiguity_reason optional string, reasoning_trace: [{step, description, operation_type optional}], " +
      'confidence_band: "high"|"medium"|"low" }. ' +
      "For Turkish history/verbal: use textual evidence and causal reasoning — do not invent calculations. " +
      "Question:\n" +
      JSON.stringify(input);

    const text = await geminiGenerateTextJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel: "Gemini independent solver",
    });

    const parsed = extractJsonObject(text, "Gemini independent solver");
    let output = normalizeGeminiSolverPayload(parsed, this.providerId, this.modelId);

    if (!output.selected_label) {
      const heuristic = solveFromStemOnly(input);
      if (heuristic.selected_label) {
        output = normalizeGeminiSolverPayload(
          {
            selected_label: heuristic.selected_label,
            is_unique: heuristic.is_unique,
            ambiguity_reason: heuristic.ambiguity_reason,
            reasoning_trace: heuristic.reasoning_trace,
            confidence_band: heuristic.confidence_band,
          },
          this.providerId,
          `${this.modelId}+heuristic`,
        );
      }
    }

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
