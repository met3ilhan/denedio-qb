import Link from "next/link";
import { notFound } from "next/navigation";

import { CandidateInspectorWorkspace } from "@/components/candidates/CandidateInspectorWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { createCandidateRepository } from "@/modules/candidates/repository/candidate-repository";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }> };

export default async function CandidateInspectorPage({ params }: PageProps) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const repo = createCandidateRepository(prisma);
  let bundle;
  try {
    bundle = await repo.getCandidateBundle(id);
  } catch {
    notFound();
  }

  const draft = generatedQuestionSchema.parse(bundle.draft);
  const distractor = bundle.distractorAnalysis
    ? distractorAnalysisSchema.parse(bundle.distractorAnalysis)
    : null;

  return (
    <StudioShell
      missionId={bundle.generationRun.missionId}
      activePhase="CANDIDATES"
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">S11 · Candidate inspector</p>
          <h1 className="text-display mt-1">Edit & distractor metadata</h1>
          <Link href={`/candidates/${id}/verification`} className="text-sm underline">
            Open S12 verification
          </Link>
        </>
      }
    >
      <CandidateInspectorWorkspace
        candidateId={id}
        initialDraft={draft}
        initialDistractor={distractor}
        verificationStaleAt={bundle.verificationStaleAt?.toISOString() ?? null}
      />
    </StudioShell>
  );
}
