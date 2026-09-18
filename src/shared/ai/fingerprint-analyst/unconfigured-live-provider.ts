import type { FingerprintAnalystInput, FingerprintAnalystResult, IFingerprintAnalystProvider } from "./types";

export class UnconfiguredLiveFingerprintAnalystProvider implements IFingerprintAnalystProvider {
  readonly providerId = "unconfigured-live";
  readonly modelId = "none";

  async infer(_input: FingerprintAnalystInput): Promise<FingerprintAnalystResult> {
    throw new Error(
      "Canlı parmak izi analizi yapılandırılmadı: QUESTION_STUDIO_GEMINI_API_KEY eksik. " +
        "Anahtarı .env.local dosyasına ekleyin veya yerel geliştirme için QUESTION_STUDIO_PROVIDER_MODE=MOCK kullanın.",
    );
  }
}
