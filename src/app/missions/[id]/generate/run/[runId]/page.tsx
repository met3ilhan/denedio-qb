import { notFound } from "next/navigation";

import { GenerationRunMonitor } from "@/components/generation/GenerationRunMonitor";
import { StudioShell } from "@/components/studio/StudioShell";
import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { prisma } from "@/shared/db/client";
import { tr } from "@/shared/copy/tr";

type PageProps = { params: Promise<{ id: string; runId: string }> };

export default async function GenerationRunPage({ params }: PageProps) {
  const { id: missionId, runId } = await params;
  if (!process.env.DATABASE_URL) {
    return (
      <StudioShell missionId={missionId} activePhase="CANDIDATES">
        <p>{tr.mission.databaseOffline}</p>
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
          <p className="text-mono text-[var(--qs-text-muted)]">{tr.generation.monitorScreen}</p>
          <h1 className="text-display mt-1">{tr.generation.monitorTitle}</h1>
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
