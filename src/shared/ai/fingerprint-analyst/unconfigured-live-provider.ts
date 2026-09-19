import { liveVendorUnconfiguredMessage } from "../live-unconfigured-message";

import type { FingerprintAnalystInput, FingerprintAnalystResult, IFingerprintAnalystProvider } from "./types";

export class UnconfiguredLiveFingerprintAnalystProvider implements IFingerprintAnalystProvider {
  readonly providerId = "unconfigured-live";
  readonly modelId = "none";

  async infer(_input: FingerprintAnalystInput): Promise<FingerprintAnalystResult> {
    throw new Error(liveVendorUnconfiguredMessage("parmak izi analizi"));
  }
}
