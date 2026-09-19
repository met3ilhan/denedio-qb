import {
  defaultOpenRouterModelId,
  openRouterGenerateJson,
  requireLiveMode,
} from "../openrouter/client";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { normalizeGeminiQuestionPayload } from "./normalize-gemini-question";
import type { GenerationInput, IGenerationProvider } from "./types";

export class OpenRouterGenerationProvider implements IGenerationProvider {
  readonly providerId = "openrouter";
  readonly modelId = defaultOpenRouterModelId();

  constructor(private readonly apiKey: string) {}

  async generate(input: GenerationInput) {
    requireLiveMode("OpenRouterGenerationProvider");
    const started = Date.now();

    const candidateCount = Math.min(
      Math.max(Number(process.env.QUESTION_STUDIO_GENERATION_CANDIDATE_COUNT ?? 1), 1),
      2,
    );

    const prompt =
      "You are an expert Turkish exam question writer. Generate ONE new multiple-choice question that is a pedagogical sibling of the locked fingerprint. " +
      "Use ONLY the pedagogical fingerprint JSON and mutation plan JSON — do NOT copy the original source wording or names verbatim. " +
      "Apply every surface mutation in the plan while preserving all invariant_assertions. " +
      "Follow distractor_regeneration roles for wrong options. Respect anti_copy_notes and operand_constraints. " +
      "Return ONLY valid JSON (no markdown) with shape: " +
      `{ schemaVersion: "${SCHEMA_VERSION}", stem: { questionText }, choices: [2-5 items with label A-D consecutive, text, isCorrect boolean — exactly one true], ` +
      "solution: { solutionText }, metadata optional { difficulty EASY|MEDIUM|HARD, expectedSolveTimeSeconds integer } }. " +
      "Write stem and choices in the same language as the fingerprint domain (Turkish for history/verbal). " +
      "Do not invent kayak rental or piecewise pricing unless the fingerprint archetype requires it.\n\n" +
      `Pedagogical fingerprint:\n${JSON.stringify(input.fingerprint)}\n\n` +
      `Mutation plan:\n${JSON.stringify(input.plan)}\n\n` +
      `Generate ${candidateCount} distinct candidate(s) in an array field "candidates" if count>1, else return the single object at top level.`;

    const { parsed, usage } = await openRouterGenerateJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel: "OpenRouter question generator",
    });

    const record = parsed as Record<string, unknown>;
    let questionRaw: unknown = parsed;
    if (Array.isArray(record.candidates) && record.candidates.length > 0) {
      questionRaw = record.candidates[0];
    }

    const output = normalizeGeminiQuestionPayload(questionRaw, input.context);

    return {
      output,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        latencyMs: Date.now() - started,
        usage,
      },
    };
  }
}
