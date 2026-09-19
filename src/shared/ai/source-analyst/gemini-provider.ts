import { defaultGeminiModelId, extractJsonObject, geminiGenerateTextJson } from "../gemini-client";
import { inputBytesSha256, resolveProviderMode } from "../provider-mode";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import {
  sourceAnalystEnvelopeSchema,
  type SourceAnalystEnvelope,
} from "@/shared/validation/source-extraction";

import { buildSourceExtractionPrompt } from "./extraction-prompt";
import { buildBlockLayers } from "./layering";
import { normalizeProviderExtraction } from "./normalize-provider-extraction";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";

/**
 * Live Gemini source analyst — failures surface as errors (no mock/demo fallback).
 * Requires QUESTION_STUDIO_GEMINI_API_KEY.
 */
export class GeminiSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "gemini";
  readonly modelId = defaultGeminiModelId();

  constructor(private readonly apiKey: string) {}

  async extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("GeminiSourceAnalystProvider invoked outside LIVE provider mode");
    }

    const stageLabel = "Gemini source analyst";
    const prompt = buildSourceExtractionPrompt(input);

    const text = await geminiGenerateTextJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel,
      inlineImage: {
        mimeType: input.mimeType,
        base64: input.bytes.toString("base64"),
      },
    });

    const parsedExtraction = extractJsonObject(text, stageLabel);

    const { extraction } = normalizeProviderExtraction(
      parsedExtraction,
      input.sourceFileId,
      "gemini",
    );

    const envelopeCandidate = {
      schemaVersion: SCHEMA_VERSION,
      extraction,
      blockLayers: buildBlockLayers(extraction.blocks),
      providerId: this.providerId,
      modelId: this.modelId,
      providerMode: "LIVE" as const,
      inputBytesSha256: inputBytesSha256(input.bytes),
    };

    return sourceAnalystEnvelopeSchema.parse(envelopeCandidate);
  }
}
