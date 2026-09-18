import { notFound } from "next/navigation";

import { StudioShell } from "@/components/studio/StudioShell";
import { MISSION_PHASE_LABELS } from "@/modules/missions/domain/mission-phase";
import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { prisma } from "@/shared/db/client";

type MissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MissionPage({ params }: MissionPageProps) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <StudioShell missionId={id} missionTitle="Mission (database offline)" activePhase="INTAKE">
        <p className="text-sm text-[var(--qs-text-muted)]">
          Set <code className="font-mono text-xs">DATABASE_URL</code> and run migrations to load
          mission data.
        </p>
      </StudioShell>
    );
  }

  const repo = createMissionRepository(prisma);
  const mission = await repo.getMissionById(id);

  if (!mission) {
    notFound();
  }

  return (
    <StudioShell
      missionId={mission.id}
      missionTitle={mission.title}
      activePhase={mission.phase}
      showBlockers
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">
            MISSION / {MISSION_PHASE_LABELS[mission.phase].toUpperCase()}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px] sm:leading-[34px]">
            {mission.title}
          </h1>
        </>
      }
    >
      <section className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--qs-text)]">Workspace</h2>
        <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
          Phase screens (S02–S18) attach here as gates land. Recent provenance:
        </p>
        <ul className="mt-4 space-y-2 font-mono text-xs text-[var(--qs-text-muted)]">
          {mission.events.length === 0 ? (
            <li>No events recorded.</li>
          ) : (
            mission.events.map((event) => (
              <li key={event.id}>
                {event.createdAt.toISOString()} · {event.eventType}
              </li>
            ))
          )}
        </ul>
      </section>
    </StudioShell>
  );
}
