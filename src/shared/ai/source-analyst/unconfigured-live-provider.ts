import { liveVendorUnconfiguredMessage } from "../live-unconfigured-message";
import type { SourceAnalystEnvelope } from "@/shared/validation/source-extraction";

import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";

export class UnconfiguredLiveSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "live";
  readonly modelId = "unconfigured";

  async extract(_input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    throw new Error(liveVendorUnconfiguredMessage("kaynak analizi"));
  }
}
