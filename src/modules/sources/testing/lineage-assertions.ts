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
