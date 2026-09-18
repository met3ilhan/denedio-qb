import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { createMutationPlannerProvider } from "@/shared/ai/mutation-planner";
import type { PrismaClient } from "@/shared/db/client";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";

export async function proposeMutationPlanForFingerprintVersion(
  db: PrismaClient,
  fingerprintVersionId: string,
) {
  const fingerprints = createFingerprintRepository(db);
  const version = await fingerprints.getVersionById(fingerprintVersionId);
  if (!version) {
    throw new Error("Fingerprint version not found");
  }

  const fingerprint = pedagogicalFingerprintSchema.parse(version.payload);
  const extraction = sourceExtractionSchema.parse(version.fingerprint.sourceQuestion.structured);
  const sourceQuestionId = version.fingerprint.sourceQuestionId;

  const planner = createMutationPlannerProvider();
  const { output, meta } = await planner.plan({
    fingerprintVersionId,
    fingerprint,
    extraction: {
      stemText: extraction.stemText,
      choices: extraction.choices,
      solutionText: extraction.solutionText,
      language: extraction.language,
    },
    sourceQuestionId,
  });

  return { plan: output, plannerProviderId: meta.providerId, plannerModelId: meta.modelId };
}
