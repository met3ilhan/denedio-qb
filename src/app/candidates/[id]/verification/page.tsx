import { notFound } from "next/navigation";

import { VerificationFindingsWorkspace } from "@/components/candidates/VerificationFindingsWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { createCandidateRepository } from "@/modules/candidates/repository/candidate-repository";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }> };

export default async function CandidateVerificationPage({ params }: PageProps) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const repo = createCandidateRepository(prisma);
  let bundle;
  try {
    bundle = await repo.getCandidateBundle(id);
  } catch {
    notFound();
  }

  const verification = await repo.getLatestVerification(id);

  return (
    <StudioShell
      missionId={bundle.generationRun.missionId}
      activePhase="CANDIDATES"
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">S12 · Verification findings</p>
          <h1 className="text-display mt-1">PASS / WARNING / FAIL</h1>
        </>
      }
    >
      <VerificationFindingsWorkspace
        candidateId={id}
        verification={verification}
        stale={Boolean(bundle.verificationStaleAt)}
      />
    </StudioShell>
  );
}
