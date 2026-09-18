import type { Prisma } from "@prisma/client";

import { runVerificationEngine } from "@/modules/verification/services/rule-engine";
import type { PrismaClient } from "@/shared/db/client";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { solverResultSchema } from "@/shared/validation/solver-result";
import { verificationResultSchema } from "@/shared/validation/verification-result";

export class CandidateBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateBlockedError";
  }
}

const MEANINGFUL_STEM_MIN_DELTA = 12;

export class CandidateRepository {
  constructor(private readonly db: PrismaClient) {}

  async getCandidateBundle(candidateId: string) {
    return this.db.generatedQuestionCandidate.findUniqueOrThrow({
      where: { id: candidateId },
      include: {
        generationRun: {
          include: {
            mutationPlans: true,
            fingerprintVersion: {
              include: {
                fingerprint: { include: { sourceQuestion: true } },
              },
            },
          },
        },
        solverRuns: { orderBy: { createdAt: "desc" }, take: 1 },
        verifierRuns: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  }

  async updateCandidateDraft(candidateId: string, draftPatch: { stemText?: string; choices?: unknown }) {
    const bundle = await this.getCandidateBundle(candidateId);
    const current = generatedQuestionSchema.parse(bundle.draft);
    const nextStem =
      draftPatch.stemText !== undefined
        ? { ...current.stem, questionText: draftPatch.stemText }
        : current.stem;
    const nextChoices =
      draftPatch.choices !== undefined
        ? (draftPatch.choices as typeof current.choices)
        : current.choices;

    const next = generatedQuestionSchema.parse({
      ...current,
      stem: nextStem,
      choices: nextChoices,
    });

    const stemChanged =
      draftPatch.stemText !== undefined &&
      meaningfulTextChange(current.stem.questionText, draftPatch.stemText);
    const choicesChanged = draftPatch.choices !== undefined;

    const invalidate = stemChanged || choicesChanged;

    if (invalidate) {
      await this.db.verifierRun.updateMany({
        where: { candidateId, stale: false },
        data: { stale: true },
      });
    }

    return this.db.generatedQuestionCandidate.update({
      where: { id: candidateId },
      data: {
        draft: next as Prisma.InputJsonValue,
        verificationStaleAt: invalidate ? new Date() : bundle.verificationStaleAt,
        status: invalidate ? "SOLVED" : bundle.status,
      },
    });
  }

  async reverifyCandidate(candidateId: string) {
    const bundle = await this.getCandidateBundle(candidateId);
    const question = generatedQuestionSchema.parse(bundle.draft);
    const plan = mutationPlanSchema.parse(
      bundle.generationRun.mutationPlans.find((p) => p.id === bundle.mutationPlanId)?.payload,
    );
    const fingerprint = pedagogicalFingerprintSchema.parse(
      bundle.generationRun.fingerprintVersion.payload,
    );
    const distractor = bundle.distractorAnalysis
      ? distractorAnalysisSchema.parse(bundle.distractorAnalysis)
      : null;
    const solver = bundle.solverRuns[0]
      ? solverResultSchema.parse(bundle.solverRuns[0].result)
      : null;
    const sourceStem =
      (bundle.generationRun.fingerprintVersion.fingerprint.sourceQuestion.structured as {
        stemText?: string;
      })?.stemText ?? undefined;

    const siblingPlans = bundle.generationRun.mutationPlans
      .filter((p) => p.id !== bundle.mutationPlanId)
      .map((p) => mutationPlanSchema.parse(p.payload));

    const verification = runVerificationEngine({
      candidateId,
      question,
      plan,
      fingerprint,
      distractor,
      solver,
      sourceStem,
      siblingPlans,
    });

    const run = await this.db.verifierRun.create({
      data: {
        candidateId,
        result: verification as Prisma.InputJsonValue,
      },
    });

    await this.db.generatedQuestionCandidate.update({
      where: { id: candidateId },
      data: {
        status: "VERIFIED",
        verificationStaleAt: null,
      },
    });

    return { verifierRunId: run.id, verification };
  }

  async getLatestVerification(candidateId: string) {
    const run = await this.db.verifierRun.findFirst({
      where: { candidateId, stale: false },
      orderBy: { createdAt: "desc" },
    });
    if (!run) return null;
    return verificationResultSchema.parse(run.result);
  }

  async approveCandidate(candidateId: string, input: { checklist: Record<string, boolean>; comment?: string }) {
    const verification = await this.getLatestVerification(candidateId);
    if (!verification || verification.quality_gate === "GATE_FAIL") {
      throw new CandidateBlockedError("Approval blocked: verification FAIL or missing");
    }
    const bundle = await this.getCandidateBundle(candidateId);
    if (bundle.verificationStaleAt) {
      throw new CandidateBlockedError("Approval blocked: verification stale after edits");
    }
    const question = generatedQuestionSchema.parse(bundle.draft);

    const record = await this.db.approvalRecord.create({
      data: {
        candidateId,
        checklist: input.checklist as Prisma.InputJsonValue,
        comment: input.comment,
        decision: "APPROVED",
      },
    });

    const generated = await this.db.generatedQuestion.create({
      data: {
        candidateId,
        sourceQuestionId: question.provenance.sourceQuestionId,
        fingerprintVersionId: question.provenance.fingerprintVersionId,
        importExternalKey: `qs:${candidateId}`,
        status: "APPROVED",
        versions: {
          create: {
            versionNumber: 1,
            content: question as Prisma.InputJsonValue,
          },
        },
      },
    });

    await this.db.generatedQuestionCandidate.update({
      where: { id: candidateId },
      data: { status: "APPROVED" },
    });

    return { approvalId: record.id, generatedQuestionId: generated.id };
  }

  async rejectCandidate(candidateId: string, input: { reason: string }) {
    await this.db.approvalRecord.create({
      data: {
        candidateId,
        checklist: { rejected: true } as Prisma.InputJsonValue,
        comment: input.reason,
        decision: "REJECTED",
      },
    });
    return this.db.generatedQuestionCandidate.update({
      where: { id: candidateId },
      data: { status: "REJECTED" },
    });
  }
}

function meaningfulTextChange(before: string, after: string) {
  if (before.trim() === after.trim()) return false;
  return Math.abs(before.length - after.length) >= MEANINGFUL_STEM_MIN_DELTA || before.trim() !== after.trim();
}

export function createCandidateRepository(db: PrismaClient) {
  return new CandidateRepository(db);
}
