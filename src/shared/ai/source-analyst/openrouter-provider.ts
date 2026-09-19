import { openRouterGenerateJson } from "../openrouter/client";
import { openRouterModelForStage } from "../openrouter/stage-models";
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

/** Live OpenRouter source analyst — failures surface as errors (no mock/demo fallback). */
export class OpenRouterSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "openrouter";
  readonly modelId = openRouterModelForStage("source");

  constructor(private readonly apiKey: string) {}

  async extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("OpenRouterSourceAnalystProvider invoked outside LIVE provider mode");
    }

    const stageLabel = "OpenRouter source analyst";
    const prompt = buildSourceExtractionPrompt(input);

    const { parsed: parsedExtraction, usage } = await openRouterGenerateJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel,
      inlineImage: {
        mimeType: input.mimeType,
        base64: input.bytes.toString("base64"),
      },
    });

    const { extraction } = normalizeProviderExtraction(
      parsedExtraction,
      input.sourceFileId,
      "openrouter",
    );

    const envelopeCandidate = {
      schemaVersion: SCHEMA_VERSION,
      extraction,
      blockLayers: buildBlockLayers(extraction.blocks),
      providerId: this.providerId,
      modelId: this.modelId,
      providerMode: "LIVE" as const,
      inputBytesSha256: inputBytesSha256(input.bytes),
      usage,
    };

    return sourceAnalystEnvelopeSchema.parse(envelopeCandidate);
  }
}
