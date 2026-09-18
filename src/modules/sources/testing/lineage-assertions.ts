import type { PrismaClient } from "@/shared/db/client";

export type LineageChain = {
  sourceFileId: string;
  extractionJobId: string;
  sourceQuestionId?: string;
  fingerprintVersionId?: string;
  generationRunId?: string;
  candidateId?: string;
  generatedQuestionId?: string;
};

/** Returns true when candidate's provenance chain resolves to the given source file. */
export async function candidateTracesToSourceFile(
  db: PrismaClient,
  candidateId: string,
  sourceFileId: string,
): Promise<boolean> {
  const candidate = await db.generatedQuestionCandidate.findUnique({
    where: { id: candidateId },
    include: {
      generationRun: {
        include: {
          fingerprintVersion: {
            include: {
              fingerprint: { include: { sourceQuestion: true } },
            },
          },
        },
      },
      generatedQuestion: { include: { versions: true } },
    },
  });
  if (!candidate?.generationRun?.fingerprintVersion?.fingerprint?.sourceQuestion) {
    return false;
  }
  return candidate.generationRun.fingerprintVersion.fingerprint.sourceQuestion.sourceFileId === sourceFileId;
}

export async function extractionJobTracesToSourceFile(
  db: PrismaClient,
  extractionJobId: string,
  sourceFileId: string,
): Promise<boolean> {
  const job = await db.extractionJob.findUnique({ where: { id: extractionJobId } });
  return job?.sourceFileId === sourceFileId;
}

export async function fingerprintTracesToSourceQuestion(
  db: PrismaClient,
  fingerprintVersionId: string,
  sourceQuestionId: string,
): Promise<boolean> {
  const version = await db.pedagogicalFingerprintVersion.findUnique({
    where: { id: fingerprintVersionId },
    include: { fingerprint: true },
  });
  return version?.fingerprint.sourceQuestionId === sourceQuestionId;
}

export async function acceptedExtractionStemForSourceFile(
  db: PrismaClient,
  sourceFileId: string,
): Promise<string | null> {
  const sq = await db.sourceQuestion.findFirst({
    where: { sourceFileId, reviewStatus: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
  });
  if (!sq?.structured || typeof sq.structured !== "object") return null;
  const stem = (sq.structured as { stemText?: string }).stemText;
  return typeof stem === "string" ? stem : null;
}

/** Fingerprint measured_skill must not be legacy piecewise template when stem is non-math. */
export function fingerprintStemCoherent(
  stemText: string,
  measuredSkill: string,
): boolean {
  const lowerStem = stemText.toLowerCase();
  const piecewiseStem =
    /kayak|first hour|additional hour|ilk saat|ek saat|piecewise|coins for the/i.test(lowerStem);
  const legacyPiecewiseSkill = measuredSkill.toLowerCase().includes("piecewise rate structure");
  if (legacyPiecewiseSkill && !piecewiseStem) return false;
  if (measuredSkill.toLowerCase().includes("kayak") && !lowerStem.includes("kayak")) return false;
  return true;
}
