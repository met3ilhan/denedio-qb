import { resolveProviderMode } from "../provider-mode";
import { detectFingerprintDomain } from "./domain-detect";
import {
  buildGenericFingerprintDraft,
  buildHistoryFingerprintDraft,
  buildPiecewiseMathFingerprintDraft,
} from "./mock-templates";
import type { FingerprintAnalystInput, FingerprintAnalystResult, IFingerprintAnalystProvider } from "./types";

export class MockFingerprintAnalystProvider implements IFingerprintAnalystProvider {
  readonly providerId = "mock";
  readonly modelId = "deterministic-fingerprint-v2";

  async infer(input: FingerprintAnalystInput): Promise<FingerprintAnalystResult> {
    const started = Date.now();
    const domain = detectFingerprintDomain(input.extraction.stemText);
    let draft;
    switch (domain) {
      case "piecewise_math":
        draft = buildPiecewiseMathFingerprintDraft(input.extraction, input.sourceQuestionId);
        break;
      case "history":
        draft = buildHistoryFingerprintDraft(input.extraction, input.sourceQuestionId);
        break;
      default:
        draft = buildGenericFingerprintDraft(input.extraction, input.sourceQuestionId);
    }

    return {
      ...draft,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        providerMode: resolveProviderMode(),
        latencyMs: Date.now() - started,
      },
    };
  }
}
