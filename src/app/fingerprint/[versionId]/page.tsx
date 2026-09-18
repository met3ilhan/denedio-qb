import { notFound } from "next/navigation";

import { FingerprintStudioWorkspace } from "@/components/fingerprint/FingerprintStudioWorkspace";
import { StudioShell } from "@/components/studio/StudioShell";
import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { prisma } from "@/shared/db/client";
import { tr } from "@/shared/copy/tr";

type PageProps = { params: Promise<{ versionId: string }> };

const DIMENSION_GROUPS = [
  {
    group: tr.fingerprint.groups.mechanism,
    keys: [
      "measured_skill",
      "learning_objective",
      "cognitive_operation",
      "reasoning_pattern",
      "solution_skeleton",
      "critical_signal",
      "hidden_constraint",
      "reasoning_steps",
      "information_order",
    ],
  },
  {
    group: tr.fingerprint.groups.burden,
    keys: ["calculation_burden", "language_burden", "visual_reasoning_burden", "expected_solve_time_seconds"],
  },
  {
    group: tr.fingerprint.groups.distractors,
    keys: [
      "distractor_mechanisms",
      "misconception_targets",
      "trap_types",
      "elimination_opportunities",
      "difficulty_factors",
    ],
  },
  {
    group: tr.fingerprint.groups.surface,
    keys: ["question_archetype", "mutable_surface_notes"],
  },
];

export default async function FingerprintStudioPage({ params }: PageProps) {
  const { versionId } = await params;

  if (!process.env.DATABASE_URL) {
    notFound();
  }

  const repo = createFingerprintRepository(prisma);
  const version = await repo.getVersionById(versionId);
  if (!version) notFound();

  const payload = pedagogicalFingerprintSchema.parse(version.payload);

  return (
    <StudioShell
      activePhase="MECHANISM"
      missionId={version.fingerprint.sourceQuestion.sourceFile.missionId}
      showBlockers={false}
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">{tr.fingerprint.studioScreen}</p>
          <h1 className="text-display mt-1 text-[var(--qs-text)]">{tr.fingerprint.studioTitle}</h1>
        </>
      }
    >
      <FingerprintStudioWorkspace
        versionId={version.id}
        versionNumber={version.versionNumber}
        status={version.status}
        payload={payload as unknown as Record<string, unknown>}
        evidence={version.evidence.map((row) => ({
          id: row.id,
          dimensionKey: row.dimensionKey,
          excerpt: row.excerpt,
          evidenceType: row.evidenceType,
        }))}
        dimensionGroups={DIMENSION_GROUPS}
      />
    </StudioShell>
  );
}
