import { notFound } from "next/navigation";

import { ApprovalWorkspace } from "@/components/candidates/ApprovalWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { createCandidateRepository } from "@/modules/candidates/repository/candidate-repository";
import { prisma } from "@/shared/db/client";
import { tr } from "@/shared/copy/tr";

type PageProps = { params: Promise<{ id: string }> };

export default async function CandidateApprovalPage({ params }: PageProps) {
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
      activePhase="SHIP"
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">{tr.candidates.approvalScreen}</p>
          <h1 className="text-display mt-1">{tr.candidates.approvalTitle}</h1>
        </>
      }
    >
      <ApprovalWorkspace
        candidateId={id}
        verification={verification}
        stale={Boolean(bundle.verificationStaleAt)}
      />
    </StudioShell>
  );
}
