import { liveVendorUnconfiguredMessage } from "../live-unconfigured-message";

import type { GenerationInput, IGenerationProvider } from "./types";

export class UnconfiguredLiveGenerationProvider implements IGenerationProvider {
  readonly providerId = "unconfigured-live";
  readonly modelId = "unconfigured";

  async generate(_input: GenerationInput): Promise<never> {
    throw new Error(liveVendorUnconfiguredMessage("soru üretimi"));
  }
}
