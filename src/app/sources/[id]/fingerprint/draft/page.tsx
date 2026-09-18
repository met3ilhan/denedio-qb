import Link from "next/link";
import { notFound } from "next/navigation";

import { FingerprintDraftWorkspace } from "@/components/fingerprint/FingerprintDraftWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { inferFingerprintDraftFromExtraction } from "@/modules/fingerprints/services/draft-inference";
import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }> };

const DIMENSION_PREVIEW_KEYS = [
  "measured_skill",
  "learning_objective",
  "cognitive_operation",
  "reasoning_pattern",
  "critical_signal",
  "hidden_constraint",
] as const;

export default async function FingerprintDraftPage({ params }: PageProps) {
  const { id: sourceFileId } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <StudioShell activePhase="MECHANISM" showBlockers={false} header={<DraftHeader />}>
        <p className="text-body text-[var(--qs-text-muted)]">Database offline.</p>
      </StudioShell>
    );
  }

  const sources = createSourceRepository(prisma);
  const fingerprints = createFingerprintRepository(prisma);
  const source = await sources.getSourceFileById(sourceFileId);
  if (!source) notFound();

  let version = await fingerprints.getLatestDraftForSourceFile(sourceFileId);
  const accepted = await fingerprints.getAcceptedSourceQuestionForFile(sourceFileId);
  if (!accepted) {
    return (
      <StudioShell activePhase="MECHANISM" showBlockers={false} header={<DraftHeader />}>
        <p className="text-body text-[var(--qs-text-muted)]">
          Accept structured extraction on{" "}
          <Link href={`/sources/${sourceFileId}/structured`} className="underline">
            S05
          </Link>{" "}
          before drafting a fingerprint.
        </p>
      </StudioShell>
    );
  }

  const extraction = sourceExtractionSchema.parse(accepted.structured);
  const inferred = inferFingerprintDraftFromExtraction(extraction, accepted.id);

  if (!version) {
    version = await fingerprints.createDraftFromInference(
      accepted.id,
      sourceFileId,
      inferred,
    );
  }

  const payload = pedagogicalFingerprintSchema.parse(version.payload);

  const dimensions = DIMENSION_PREVIEW_KEYS.map((key) => ({
    key,
    label: key,
    value:
      key === "critical_signal"
        ? payload.critical_signal.role
        : String((payload as Record<string, unknown>)[key] ?? ""),
    confidence: "medium" as const,
  }));

  return (
    <StudioShell
      activePhase="MECHANISM"
      missionId={source.missionId}
      missionTitle={source.mission?.title}
      showBlockers={false}
      header={<DraftHeader />}
    >
      <FingerprintDraftWorkspace
        sourceFileId={sourceFileId}
        versionId={version.id}
        dimensions={dimensions}
        evidence={version.evidence.map((row) => ({
          id: row.id,
          dimensionKey: row.dimensionKey,
          excerpt: row.excerpt,
          pointer: row.pointer as { sourceBlockId?: string },
        }))}
        gapWarnings={inferred.gapWarnings}
        blocks={extraction.blocks.map((b) => ({ blockId: b.blockId, text: b.text }))}
      />
    </StudioShell>
  );
}

function DraftHeader() {
  return (
    <>
      <p className="text-mono text-[var(--qs-text-muted)]">S06 · Fingerprint Draft</p>
      <h1 className="text-display mt-1 text-[var(--qs-text)]">Fingerprint draft</h1>
    </>
  );
}
