import type { Prisma } from "@prisma/client";

import type { PrismaClient } from "@/shared/db/client";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { runVerificationEngine } from "@/modules/verification/services/rule-engine";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { solverResultSchema } from "@/shared/validation/solver-result";

export class QuestionRevisionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionRevisionBlockedError";
  }
}

export class QuestionRepository {
  constructor(private readonly db: PrismaClient) {}

  async reviseApprovedQuestion(
    generatedQuestionId: string,
    input: {
      content: unknown;
      revisionReason: string;
      actorLabel?: string;
    },
  ) {
    const question = await this.db.generatedQuestion.findUnique({
      where: { id: generatedQuestionId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    if (!question || question.status !== "APPROVED") {
      throw new QuestionRevisionBlockedError("Only approved questions can be revised");
    }
    const latest = question.versions[0];
    if (!latest) {
      throw new QuestionRevisionBlockedError("Question has no versions");
    }

    const parsed = generatedQuestionSchema.parse(input.content);
    const nextNumber = latest.versionNumber + 1;

    const created = await this.db.questionVersion.create({
      data: {
        generatedQuestionId,
        versionNumber: nextNumber,
        content: parsed as Prisma.InputJsonValue,
        parentVersionId: latest.id,
        revisionReason: input.revisionReason,
        createdByLabel: input.actorLabel ?? "expert",
        verificationState: "NEEDS_REVERIFY",
        approvalState: "DRAFT",
      },
    });

    return created;
  }

  async reverifyLatestVersion(generatedQuestionId: string) {
    const question = await this.db.generatedQuestion.findUnique({
      where: { id: generatedQuestionId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        candidate: {
          include: {
            generationRun: {
              include: {
                mutationPlans: true,
                fingerprintVersion: {
                  include: { fingerprint: { include: { sourceQuestion: true } } },
                },
              },
            },
            solverRuns: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });
    if (!question?.versions[0] || !question.candidate) {
      throw new QuestionRevisionBlockedError("Missing version or candidate context");
    }

    const version = question.versions[0];
    const bundle = question.candidate;
    const content = generatedQuestionSchema.parse(version.content);
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

    const verification = runVerificationEngine({
      candidateId: bundle.id,
      question: content,
      plan,
      fingerprint,
      distractor,
      solver,
      sourceStem,
      siblingPlans: bundle.generationRun.mutationPlans
        .filter((p) => p.id !== bundle.mutationPlanId)
        .map((p) => mutationPlanSchema.parse(p.payload)),
    });

    if (verification.quality_gate === "GATE_FAIL") {
      throw new QuestionRevisionBlockedError("Re-verify failed: GATE_FAIL");
    }

    await this.db.questionVersion.update({
      where: { id: version.id },
      data: {
        verificationState: "VERIFIED",
        approvalState: "APPROVED",
      },
    });

    return { verification, versionId: version.id };
  }
}

export function createQuestionRepository(db: PrismaClient) {
  return new QuestionRepository(db);
}
