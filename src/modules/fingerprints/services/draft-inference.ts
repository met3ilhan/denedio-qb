import { getFingerprintAnalystProvider } from "@/shared/ai/fingerprint-analyst";
import {
  isLegacyStaticPiecewiseFingerprint,
  detectFingerprintDomain,
} from "@/shared/ai/fingerprint-analyst/domain-detect";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

export type InferredFingerprintDraft = {
  payload: PedagogicalFingerprint;
  evidenceRows: Array<{
    dimensionKey: string;
    evidenceType: string;
    pointer: Record<string, unknown>;
    excerpt: string;
  }>;
  gapWarnings: string[];
};

export const FINGERPRINT_INFERENCE_ALGORITHM_ID = "fingerprint-analyst-v2";

/** Provider-backed inference (LIVE Gemini or deterministic MOCK by domain). */
export async function inferFingerprintDraftFromExtraction(
  extraction: SourceExtraction,
  sourceQuestionId: string,
  sourceFileId?: string,
): Promise<InferredFingerprintDraft> {
  const provider = getFingerprintAnalystProvider();
  const result = await provider.infer({ extraction, sourceQuestionId, sourceFileId });
  return {
    payload: result.payload,
    evidenceRows: result.evidenceRows,
    gapWarnings: result.gapWarnings,
  };
}

/** True when a persisted DRAFT still carries the pre-v2 static piecewise template for a non-math stem. */
export function isStaleLegacyFingerprintDraft(
  payload: PedagogicalFingerprint,
  extraction: SourceExtraction,
): boolean {
  if (!isLegacyStaticPiecewiseFingerprint(payload.measured_skill)) {
    return false;
  }
  return detectFingerprintDomain(extraction.stemText) !== "piecewise_math";
}
