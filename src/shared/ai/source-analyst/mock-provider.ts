import { createHash } from "node:crypto";

import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { sourceAnalystEnvelopeSchema } from "@/shared/validation/source-extraction";

import {
  extractCanaryMarker,
  isExplicitDemoSource,
  resolveProviderMode,
} from "../provider-mode";
import { SYNTHETIC_RIVER_FIXTURE } from "../fixtures/synthetic-river-problem";
import { buildBlockLayers } from "./layering";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";

function buildBlocksFromStemAndChoices(
  stemText: string,
  choices: Array<{ label: "A" | "B" | "C" | "D"; text: string; isCorrect?: boolean }>,
) {
  return [
    {
      blockId: "stem-auto",
      type: "stem" as const,
      text: stemText,
      confidence: 0.9,
      page: 1,
    },
    ...choices.map((c) => ({
      blockId: `choice-${c.label.toLowerCase()}`,
      type: "choice" as const,
      choiceLabel: c.label,
      text: c.text,
      confidence: 0.85,
      page: 1,
    })),
  ];
}

export function buildMockExtractionFromInput(input: SourceAnalystInput) {
  const mode = resolveProviderMode();

  if (isExplicitDemoSource(input)) {
    return {
      envelope: {
        ...SYNTHETIC_RIVER_FIXTURE,
        providerId: "mock",
        modelId: "mock-source-analyst-v1",
      },
      providerMode: "DEMO" as const,
      demoFixtureId: SYNTHETIC_RIVER_FIXTURE.demoFixtureId,
    };
  }

  const digest = createHash("sha256").update(input.bytes).digest("hex").slice(0, 8);
  const canary = extractCanaryMarker(input.bytes);

  if (canary) {
    const stemText =
      `${canary} — Osmanlı Devleti'nde Lale Devri hangi padişah döneminde yaşanmıştır? ` +
      `(kaynak: ${input.originalFilename})`;
    const choices = [
      { label: "A" as const, text: "III. Ahmed" },
      { label: "B" as const, text: "III. Selim", isCorrect: true },
      { label: "C" as const, text: "II. Mahmud" },
      { label: "D" as const, text: "I. Abdülhamid" },
    ];
    const extraction = {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey: `canary-${canary}`,
      language: input.languageHint ?? "tr",
      stemText,
      choices,
      solutionText: "Lale Devri III. Ahmed döneminde yaşanmıştır.",
      blocks: buildBlocksFromStemAndChoices(stemText, choices),
      extractionWarnings: [
        "Mock analiz: görsel OCR yok; dosya içindeki DENEDIO-CANARY işaretçisi kullanıldı.",
      ],
    };
    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      extraction,
      blockLayers: buildBlockLayers(extraction.blocks),
      providerId: "mock",
      modelId: "mock-source-analyst-v1",
      providerMode: mode,
      inputBytesSha256: createHash("sha256").update(input.bytes).digest("hex"),
    };
    return { envelope: sourceAnalystEnvelopeSchema.parse(envelope), providerMode: mode, demoFixtureId: undefined };
  }

  const stemText =
    `Mock çıkarım — "${input.originalFilename}" (SHA256:${digest}). ` +
    "Canlı yapay zeka yapılandırılmadığı için otomatik metin okuma yapılmadı. " +
    "Lütfen soru kökünü ve seçenekleri manuel doğrulayın veya canlı analizi etkinleştirin.";

  const choices = [
    { label: "A" as const, text: "Seçenek A (mock)" },
    { label: "B" as const, text: "Seçenek B (mock)" },
    { label: "C" as const, text: "Seçenek C (mock)" },
    { label: "D" as const, text: "Seçenek D (mock)" },
  ];

  const extraction = {
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionKey: `mock-${digest}`,
    language: input.languageHint ?? "tr",
    stemText,
    choices,
    solutionText: "Mock mod: çözüm uzman tarafından girilmelidir.",
    blocks: buildBlocksFromStemAndChoices(stemText, choices),
    extractionWarnings: [
      "Bu kaynak için canlı yapay zekâ analizi etkin değil. Gösterilen alanlar yer tutucudur; yüklediğiniz görseli sol panelden karşılaştırın.",
    ],
  };

  const envelope = {
    schemaVersion: SCHEMA_VERSION,
    extraction,
    blockLayers: buildBlockLayers(extraction.blocks),
    providerId: "mock",
    modelId: "mock-source-analyst-v1",
    providerMode: mode,
    inputBytesSha256: createHash("sha256").update(input.bytes).digest("hex"),
  };

  return {
    envelope: sourceAnalystEnvelopeSchema.parse(envelope),
    providerMode: mode,
    demoFixtureId: undefined,
  };
}

export class MockSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-source-analyst-v1";

  async extract(input: SourceAnalystInput) {
    const { envelope } = buildMockExtractionFromInput(input);
    return envelope;
  }
}
