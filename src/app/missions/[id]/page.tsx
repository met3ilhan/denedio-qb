import { notFound } from "next/navigation";

import { StudioShell } from "@/components/studio/StudioShell";
import { MISSION_PHASE_LABELS } from "@/modules/missions/domain/mission-phase";
import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { MissionWorkflowHub } from "@/components/studio/MissionWorkflowHub";
import { listMissionBlockers } from "@/modules/missions/services/mission-blockers";
import { listMissionWorkflowSteps } from "@/modules/missions/services/mission-workflow";
import { prisma } from "@/shared/db/client";
import { tr } from "@/shared/copy/tr";

type MissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MissionPage({ params }: MissionPageProps) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <StudioShell missionId={id} missionTitle={tr.mission.offlineTitle} activePhase="INTAKE">
        <p className="text-sm text-[var(--qs-text-muted)]">{tr.mission.offlineBody}</p>
      </StudioShell>
    );
  }

  const repo = createMissionRepository(prisma);
  const mission = await repo.getMissionById(id);
  const blockers = await listMissionBlockers(prisma, id);
  const workflowSteps = await listMissionWorkflowSteps(prisma, id);

  if (!mission) {
    notFound();
  }

  return (
    <StudioShell
      missionId={mission.id}
      missionTitle={mission.title}
      activePhase={mission.phase}
      showBlockers
      blockers={blockers}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">
            {tr.mission.missionPrefix} / {MISSION_PHASE_LABELS[mission.phase].toUpperCase()}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px] sm:leading-[34px]">
            {mission.title}
          </h1>
        </>
      }
    >
      <MissionWorkflowHub steps={workflowSteps} missionId={mission.id} />
    </StudioShell>
  );
}
