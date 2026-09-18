import Link from "next/link";
import { notFound } from "next/navigation";

import { GenerationSetupWorkspace } from "@/components/generation/GenerationSetupWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { previewTrivialMutationFlags } from "@/shared/validation/trivial-mutation";
import { prisma } from "@/shared/db/client";
import { tr } from "@/shared/copy/tr";

type PageProps = { params: Promise<{ id: string }> };

export default async function GenerationSetupPage({ params }: PageProps) {
  const { id: missionId } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <StudioShell missionId={missionId} activePhase="MECHANISM" showBlockers={false}>
        <p className="text-body text-[var(--qs-text-muted)]">{tr.mission.databaseOffline}</p>
      </StudioShell>
    );
  }

  const missions = createMissionRepository(prisma);
  const fingerprints = createFingerprintRepository(prisma);
  const mission = await missions.getMissionById(missionId);
  if (!mission) notFound();

  const locked = await fingerprints.getLockedVersionForMission(missionId);
  if (!locked) {
    return (
      <StudioShell
        missionId={mission.id}
        missionTitle={mission.title}
        activePhase="MECHANISM"
        showBlockers={false}
        header={
          <>
            <p className="text-mono text-[var(--qs-text-muted)]">{tr.generation.setupScreen}</p>
            <h1 className="text-display mt-1 text-[var(--qs-text)]">{tr.generation.setupTitle}</h1>
          </>
        }
      >
        <p className="text-body text-[var(--qs-text-muted)]">
          {tr.generation.lockFingerprintFirst}{" "}
          <Link href="/sources" className="underline">
            {tr.generation.lockFingerprintPath}
          </Link>
          .
        </p>
      </StudioShell>
    );
  }

  const sample = buildSampleMutationPlan(locked.id);
  const flags = previewTrivialMutationFlags(sample);

  return (
    <StudioShell
      missionId={mission.id}
      missionTitle={mission.title}
      activePhase="MECHANISM"
      showBlockers={false}
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">{tr.generation.setupScreen}</p>
          <h1 className="text-display mt-1 text-[var(--qs-text)]">{tr.generation.setupTitle}</h1>
        </>
      }
    >
      <GenerationSetupWorkspace
        missionId={mission.id}
        fingerprintVersionId={locked.id}
        planJson={JSON.stringify(sample, null, 2)}
        initialFlags={flags}
      />
    </StudioShell>
  );
}
