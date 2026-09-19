import { liveVendorUnconfiguredMessage } from "../live-unconfigured-message";

import type { IDistractorAnalysisProvider } from "./types";

export class UnconfiguredLiveDistractorProvider implements IDistractorAnalysisProvider {
  readonly providerId = "gemini";
  readonly modelId = "unconfigured";

  async analyze(_input: Parameters<IDistractorAnalysisProvider["analyze"]>[0]): Promise<never> {
    throw new Error(
      liveVendorUnconfiguredMessage("çeldirici analizi"),
    );
  }
}
