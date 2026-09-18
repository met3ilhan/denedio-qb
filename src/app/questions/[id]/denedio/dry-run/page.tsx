import Link from "next/link";
import { notFound } from "next/navigation";

import { DryRunConsole } from "@/components/export/DryRunConsole";
import { StudioShell } from "@/components/studio/StudioShell";
import { createExportRepository } from "@/modules/export/repository/export-repository";
import { listMissionBlockers } from "@/modules/missions/services/mission-blockers";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }> };

export default async function DryRunPage({ params }: PageProps) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const question = await prisma.generatedQuestion.findUnique({
    where: { id },
    include: { candidate: { include: { generationRun: true } } },
  });
  if (!question) notFound();

  const missionId = question.candidate.generationRun.missionId;
  const blockers = await listMissionBlockers(prisma, missionId);
  const repo = createExportRepository(prisma);
  const latest = await repo.latestDryRun(id);
  const initialPassed = latest?.passed ?? false;

  return (
    <StudioShell
      missionId={missionId}
      activePhase="SHIP"
      blockers={blockers}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S18 · Dry run & export gate</p>
          <h1 className="mt-1 text-xl font-semibold">Import validation</h1>
        </>
      }
    >
      <nav className="mb-4 flex gap-3 text-sm">
        <Link href={`/questions/${id}/denedio/map`} className="underline">S17 mapping</Link>
        <Link href="/catalog" className="underline">S16 catalog</Link>
      </nav>
      <DryRunConsole
        generatedQuestionId={question.id}
        importExternalKey={question.importExternalKey}
        initialPassed={initialPassed}
      />
    </StudioShell>
  );
}
