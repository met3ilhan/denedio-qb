import { defaultGeminiModelId, extractJsonObject, geminiGenerateTextJson } from "../gemini-client";
import { MECHANISM_IDS, TRAP_TYPE_IDS } from "@/shared/validation/pedagogy-enums";
import { resolveProviderMode } from "../provider-mode";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { normalizeGeminiFingerprintPayload } from "./normalize-gemini-fingerprint";
import type { FingerprintAnalystInput, FingerprintAnalystResult, IFingerprintAnalystProvider } from "./types";
import type { FingerprintEvidenceRow } from "./types";

function buildEvidenceDraft(
  extraction: FingerprintAnalystInput["extraction"],
): { evidenceRows: FingerprintEvidenceRow[]; gapWarnings: string[] } {
  const stemBlock = extraction.blocks.find((b) => b.type === "stem") ?? extraction.blocks[0];
  const solutionBlock = extraction.blocks.find((b) => b.type === "solution");
  const gapWarnings: string[] = [];
  if (!solutionBlock?.text) {
    gapWarnings.push("Çözüm metni yok — çözüm iskeleti kanıtı kısmen çıkarımsaldır.");
  }
  const wrongChoices = extraction.choices.filter((c) => !c.isCorrect);
  if (wrongChoices.length < 2) {
    gapWarnings.push("İki veya daha az yanlış seçenek — çeldirici kapsamı sınırlı olabilir.");
  }

  return {
    evidenceRows: [
      {
        dimensionKey: "measured_skill",
        evidenceType: "source_anchor",
        pointer: { sourceBlockId: stemBlock?.blockId, page: stemBlock?.page ?? 1 },
        excerpt: extraction.stemText.slice(0, 500),
      },
    ],
    gapWarnings,
  };
}

/**
 * Live Gemini pedagogical fingerprint — failures surface as errors (no mock substitution).
 */
export class GeminiFingerprintAnalystProvider implements IFingerprintAnalystProvider {
  readonly providerId = "gemini";
  readonly modelId = defaultGeminiModelId();

  constructor(private readonly apiKey: string) {}

  async infer(input: FingerprintAnalystInput): Promise<FingerprintAnalystResult> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("GeminiFingerprintAnalystProvider invoked outside LIVE provider mode");
    }

    const started = Date.now();
    const stageLabel = "Gemini fingerprint analyst";
    const extractionJson = JSON.stringify({
      stemText: input.extraction.stemText,
      choices: input.extraction.choices,
      blocks: input.extraction.blocks,
      solutionText: input.extraction.solutionText,
      language: input.extraction.language,
    });

    const prompt =
      "You are a pedagogical analyst for Turkish exam questions. Analyze ONLY the provided structured extraction. " +
      "Return ONLY valid JSON (no markdown) matching PedagogicalFingerprint. " +
      "Types are strict: phase_id string; depends_on string[] (use [] not null); critical_substep boolean; reasoning_steps and expected_solve_time_seconds use integer min/max; " +
      "calculation_burden one of none|light_mental|multi_step_numeric|symbolic|calculator_expected; language_burden low|medium|high; " +
      "visual_reasoning_burden one of none|decode_diagram|spatial_transform|graph_read|table_cross_reference|combined. " +
      `mechanism_id must be exactly one of: ${MECHANISM_IDS.join("|")}. ` +
      `trap_type_ids and trap_types must use only: ${TRAP_TYPE_IDS.join("|")}. ` +
      "For history recall items with no hidden constraint, set hidden_constraint to a NOT_APPLICABLE sentence (never null). " +
      "Use NOT_APPLICABLE semantics honestly — do not invent math/kayak/pricing templates for non-math stems. " +
      "distractor_mechanisms: one entry per wrong choice label with slot matching choice label. " +
      `schemaVersion must be "${SCHEMA_VERSION}". sourceQuestionId: ${input.sourceQuestionId}. ` +
      "Structured extraction JSON:\n" +
      extractionJson;

    const text = await geminiGenerateTextJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel,
    });

    const parsed = extractJsonObject(text, stageLabel);

    const payload = normalizeGeminiFingerprintPayload(parsed, input.extraction, input.sourceQuestionId);
    const evidence = buildEvidenceDraft(input.extraction);

    return {
      payload,
      ...evidence,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        providerMode: "LIVE",
        latencyMs: Date.now() - started,
      },
    };
  }
}
