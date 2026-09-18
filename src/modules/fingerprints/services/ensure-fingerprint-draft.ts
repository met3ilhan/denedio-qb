import type { FingerprintRepository } from "../repository/fingerprint-repository";
import {
  inferFingerprintDraftFromExtraction,
  isStaleLegacyFingerprintDraft,
} from "./draft-inference";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

/** Create or refresh DRAFT fingerprint for accepted extraction (fixes legacy static templates). */
export async function ensureFingerprintDraftForSource(
  fingerprints: FingerprintRepository,
  sourceFileId: string,
  sourceQuestionId: string,
  extraction: SourceExtraction,
) {
  const fresh = await inferFingerprintDraftFromExtraction(extraction, sourceQuestionId, sourceFileId);
  let version = await fingerprints.getLatestDraftForSourceFile(sourceFileId);

  if (!version) {
    version = await fingerprints.createDraftFromInference(sourceQuestionId, sourceFileId, fresh);
    return { version, inferred: fresh };
  }

  const existingPayload = pedagogicalFingerprintSchema.parse(version.payload);
  if (isStaleLegacyFingerprintDraft(existingPayload, extraction)) {
    version = await fingerprints.replaceDraftFromInference(version.id, fresh);
  }

  return { version, inferred: fresh };
}
