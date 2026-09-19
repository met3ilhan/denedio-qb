import { defaultGeminiModelId, extractJsonObject, geminiGenerateTextJson } from "../gemini-client";
import { resolveProviderMode } from "../provider-mode";

import { buildFingerprintAnalysisPrompt } from "./fingerprint-prompt";
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
    const prompt = buildFingerprintAnalysisPrompt(input);

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
      rawModelPayload: parsed,
    };
  }
}
