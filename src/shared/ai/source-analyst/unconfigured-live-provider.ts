import type { SourceAnalystEnvelope } from "@/shared/validation/source-extraction";

import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";

export class UnconfiguredLiveSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "live";
  readonly modelId = "unconfigured";

  async extract(_input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    throw new Error(
      "Canlı yapay zekâ modu seçildi ancak QUESTION_STUDIO_GEMINI_API_KEY yapılandırılmadı. " +
        "Demo içeriğe sessizce düşülmez.",
    );
  }
}
