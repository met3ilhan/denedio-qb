import Link from "next/link";
import { notFound } from "next/navigation";

import { DenedioMapperWorkspace } from "@/components/export/DenedioMapperWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { listMissionBlockers } from "@/modules/missions/services/mission-blockers";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }> };

export default async function DenedioMapPage({ params }: PageProps) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const question = await prisma.generatedQuestion.findUnique({
    where: { id },
    include: { candidate: { include: { generationRun: true } } },
  });
  if (!question) notFound();

  const missionId = question.candidate.generationRun.missionId;
  const blockers = await listMissionBlockers(prisma, missionId);

  return (
    <StudioShell
      missionId={missionId}
      activePhase="SHIP"
      blockers={blockers}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S17 · Denedio payload mapper</p>
          <h1 className="mt-1 text-xl font-semibold">Field mapping</h1>
        </>
      }
    >
      <nav className="mb-4 flex gap-3 text-sm">
        <Link href={`/questions/${id}`} className="underline">S14 record</Link>
        <Link href={`/questions/${id}/denedio/dry-run`} className="underline">S18 dry-run</Link>
        <Link href="/catalog" className="underline">S16 catalog</Link>
      </nav>
      <DenedioMapperWorkspace
        generatedQuestionId={question.id}
        importExternalKey={question.importExternalKey}
      />
    </StudioShell>
  );
}
