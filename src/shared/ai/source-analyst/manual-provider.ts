import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { sourceAnalystEnvelopeSchema } from "@/shared/validation/source-extraction";

import { buildBlockLayers } from "./layering";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";

export class ManualSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "manual";
  readonly modelId = "manual-extraction-v1";

  async extract(input: SourceAnalystInput) {
    const stemText =
      `Manuel çıkarım gerekli — "${input.originalFilename}". ` +
      "Otomatik analiz kapalı; soru kökünü ve seçenekleri aşağıdan düzenleyin.";

    const choices = [
      { label: "A" as const, text: "—" },
      { label: "B" as const, text: "—" },
      { label: "C" as const, text: "—" },
      { label: "D" as const, text: "—" },
    ];

    const extraction = {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey: `manual-${input.sourceFileId}`,
      language: input.languageHint ?? "tr",
      stemText,
      choices,
      blocks: [
        {
          blockId: "stem-manual",
          type: "stem" as const,
          text: stemText,
          confidence: 0.2,
          page: 1,
        },
      ],
      extractionWarnings: ["Manuel mod: otomatik çıkarım yapılmadı."],
    };

    return sourceAnalystEnvelopeSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      extraction,
      blockLayers: buildBlockLayers(extraction.blocks),
      providerId: this.providerId,
      modelId: this.modelId,
      providerMode: "MANUAL",
    });
  }
}
