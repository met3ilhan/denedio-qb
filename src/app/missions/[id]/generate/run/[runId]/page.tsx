import { notFound } from "next/navigation";

import { GenerationRunMonitor } from "@/components/generation/GenerationRunMonitor";
import { StudioShell } from "@/components/studio/StudioShell";
import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string; runId: string }> };

export default async function GenerationRunPage({ params }: PageProps) {
  const { id: missionId, runId } = await params;
  if (!process.env.DATABASE_URL) {
    return (
      <StudioShell missionId={missionId} activePhase="CANDIDATES">
        <p>Database offline.</p>
      </StudioShell>
    );
  }

  const mission = await createMissionRepository(prisma).getMissionById(missionId);
  if (!mission) notFound();

  const run = await prisma.generationRun.findUnique({
    where: { id: runId },
    include: { candidates: true },
  });
  if (!run || run.missionId !== missionId) notFound();

  return (
    <StudioShell
      missionId={mission.id}
      missionTitle={mission.title}
      activePhase="CANDIDATES"
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">S09 · Generation monitor</p>
          <h1 className="text-display mt-1">Candidate spawn</h1>
        </>
      }
    >
      <GenerationRunMonitor
        missionId={missionId}
        runId={runId}
        candidateIds={run.candidates.map((c) => c.id)}
        status={run.status}
      />
    </StudioShell>
  );
}
