import {
  defaultOpenRouterModelId,
  openRouterGenerateJson,
  requireLiveMode,
} from "../openrouter/client";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { normalizeGeminiMutationPlanPayload } from "./normalize-gemini-mutation-plan";
import type { IMutationPlannerProvider, MutationPlannerInput } from "./types";

export class OpenRouterMutationPlannerProvider implements IMutationPlannerProvider {
  readonly providerId = "openrouter";
  readonly modelId = defaultOpenRouterModelId();

  constructor(private readonly apiKey: string) {}

  async plan(input: MutationPlannerInput) {
    requireLiveMode("OpenRouterMutationPlannerProvider");
    const started = Date.now();

    const extractionSummary = {
      stemText: input.extraction.stemText.slice(0, 2000),
      choiceCount: input.extraction.choices.length,
      language: input.extraction.language,
      hasSolution: Boolean(input.extraction.solutionText?.trim()),
    };

    const prompt =
      "You are a pedagogical mutation planner for Turkish exam question generation. " +
      "Given a LOCKED pedagogical fingerprint and a summary of the accepted source extraction, " +
      "produce a MutationPlan JSON that defines what may change vs what must stay invariant. " +
      "The plan must be specific to this source skill — not a generic template. " +
      "For history/verbal items: change context/names/wording; do NOT swap to math pricing templates. " +
      "For quantitative items: preserve calculation mechanism while mutating numbers/context per operand_constraints. " +
      "Include surface_mutations (each with dimension and description), invariant_assertions for ALL core dimensions, " +
      "operand_constraints, distractor_regeneration (one entry per wrong choice slot with mechanism_id, misconception_id, parameter_notes), " +
      "and anti_copy_notes explaining how source wording is avoided. " +
      `schemaVersion must be "${SCHEMA_VERSION}". fingerprint_ref must be "${input.fingerprintVersionId}". ` +
      "Return ONLY valid JSON (no markdown).\n\n" +
      `Fingerprint:\n${JSON.stringify(input.fingerprint)}\n\n` +
      `Source summary (do not paste into output question):\n${JSON.stringify(extractionSummary)}`;

    const { parsed, usage } = await openRouterGenerateJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel: "OpenRouter mutation planner",
    });

    const output = normalizeGeminiMutationPlanPayload(
      parsed,
      input.fingerprintVersionId,
      input.fingerprint,
    );

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
