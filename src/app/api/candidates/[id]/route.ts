import { NextResponse } from "next/server";

import {
  CandidateBlockedError,
  createCandidateRepository,
} from "@/modules/candidates/repository/candidate-repository";
import { prisma } from "@/shared/db/client";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const repo = createCandidateRepository(prisma);
  const bundle = await repo.getCandidateBundle(id);
  const verification = await repo.getLatestVerification(id);

  return NextResponse.json({
    id: bundle.id,
    status: bundle.status,
    siblingIndex: bundle.siblingIndex,
    generationRunId: bundle.generationRunId,
    draft: generatedQuestionSchema.parse(bundle.draft),
    distractorAnalysis: bundle.distractorAnalysis
      ? distractorAnalysisSchema.parse(bundle.distractorAnalysis)
      : null,
    verificationStaleAt: bundle.verificationStaleAt,
    verification,
    siblings: bundle.generationRun.mutationPlans.map((p) => ({
      planId: p.id,
      siblingIndex: p.siblingIndex,
    })),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    stemText?: string;
    choices?: unknown;
    distractorAnalysis?: unknown;
  };

  const repo = createCandidateRepository(prisma);

  try {
    if (body.distractorAnalysis) {
      const parsed = distractorAnalysisSchema.parse(body.distractorAnalysis);
      await prisma.generatedQuestionCandidate.update({
        where: { id },
        data: { distractorAnalysis: parsed },
      });
    }

    const updated = await repo.updateCandidateDraft(id, {
      stemText: body.stemText,
      choices: body.choices,
    });

    return NextResponse.json({
      id: updated.id,
      verificationStaleAt: updated.verificationStaleAt,
    });
  } catch (error) {
    if (error instanceof CandidateBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
