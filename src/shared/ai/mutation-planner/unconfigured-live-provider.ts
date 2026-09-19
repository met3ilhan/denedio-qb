import { liveVendorUnconfiguredMessage } from "../live-unconfigured-message";

import type { IMutationPlannerProvider, MutationPlannerInput } from "./types";

export class UnconfiguredLiveMutationPlannerProvider implements IMutationPlannerProvider {
  readonly providerId = "gemini";
  readonly modelId = "unconfigured";

  async plan(_input: MutationPlannerInput): Promise<never> {
    throw new Error(
      liveVendorUnconfiguredMessage("mutasyon planlama"),
    );
  }
}
