import { createHash } from "node:crypto";

import { isAcceptableLiveFingerprint } from "@/shared/ai/fingerprint-analyst/fingerprint-quality-guard";
import { getFingerprintAnalystProvider } from "@/shared/ai/fingerprint-analyst";
import { normalizeClassificationPayload } from "@/shared/ai/fingerprint-analyst/normalize-classification";
import { resolveProviderMode } from "@/shared/ai/provider-mode";
import type { OpenRouterUsageTelemetry } from "@/shared/ai/openrouter/usage";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import type { SourceExtraction } from "@/shared/validation/source-extraction";
import type { SourcePedagogicalClassification } from "@/shared/validation/source-pedagogical-classification";

export type PedagogicalAnalysisBundle = {
  extractionChecksum: string;
  fingerprint: PedagogicalFingerprint;
  evidenceRows: Array<{
    dimensionKey: string;
    evidenceType: string;
    pointer: Record<string, unknown>;
    excerpt: string;
  }>;
  classification?: SourcePedagogicalClassification;
  gapWarnings: string[];
  qualityWarnings: string[];
  providerId: string;
  modelId: string;
  usage?: OpenRouterUsageTelemetry;
  inferredAt: string;
};

export function extractionChecksum(extraction: SourceExtraction): string {
  return createHash("sha256").update(JSON.stringify(extraction)).digest("hex");
}

export async function inferPedagogicalAnalysis(
  extraction: SourceExtraction,
  sourceQuestionId: string,
  sourceFileId?: string,
): Promise<PedagogicalAnalysisBundle> {
  const provider = getFingerprintAnalystProvider();
  const result = await provider.infer({ extraction, sourceQuestionId, sourceFileId });

  const classification = normalizeClassificationPayload(result.rawModelPayload);
  const qualityWarnings: string[] = [];
  if (resolveProviderMode() === "LIVE" && !isAcceptableLiveFingerprint(result.payload)) {
    qualityWarnings.push("Parmak izi genel/eksik ifadeler içeriyor — uzman düzenlemesi önerilir.");
  }

  return {
    extractionChecksum: extractionChecksum(extraction),
    fingerprint: result.payload,
    evidenceRows: result.evidenceRows,
    classification,
    gapWarnings: result.gapWarnings,
    qualityWarnings,
    providerId: result.meta.providerId,
    modelId: result.meta.modelId,
    usage: result.meta.usage,
    inferredAt: new Date().toISOString(),
  };
}

export function readCachedPedagogicalAnalysis(
  analystMeta: Record<string, unknown> | null | undefined,
  extraction: SourceExtraction,
): PedagogicalAnalysisBundle | null {
  const cached = analystMeta?.pedagogicalAnalysis;
  if (!cached || typeof cached !== "object") {
    return null;
  }
  const bundle = cached as PedagogicalAnalysisBundle;
  if (bundle.extractionChecksum !== extractionChecksum(extraction)) {
    return null;
  }
  return bundle;
}
