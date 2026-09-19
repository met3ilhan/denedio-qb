import type { OpenRouterUsageTelemetry } from "../openrouter/usage";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

export type FingerprintAnalystInput = {
  extraction: SourceExtraction;
  sourceQuestionId: string;
  sourceFileId?: string;
};

export type FingerprintAnalystMeta = {
  providerId: string;
  modelId: string;
  providerMode: string;
  latencyMs?: number;
  usage?: OpenRouterUsageTelemetry;
};

export type FingerprintEvidenceRow = {
  dimensionKey: string;
  evidenceType: string;
  pointer: Record<string, unknown>;
  excerpt: string;
};

export type FingerprintAnalystResult = {
  payload: PedagogicalFingerprint;
  evidenceRows: FingerprintEvidenceRow[];
  gapWarnings: string[];
  meta: FingerprintAnalystMeta;
  /** Raw provider JSON before normalization (classification + fingerprint). */
  rawModelPayload?: unknown;
};

export interface IFingerprintAnalystProvider {
  readonly providerId: string;
  readonly modelId: string;
  infer(input: FingerprintAnalystInput): Promise<FingerprintAnalystResult>;
}
