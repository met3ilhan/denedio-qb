import { notFound } from "next/navigation";

import { CandidateComparisonMatrix } from "@/components/candidates/CandidateComparisonMatrix";
import { StudioShell } from "@/components/studio/StudioShell";
import { buildSiblingComparisonMatrix } from "@/modules/candidates/services/sibling-comparison";
import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { createCandidateRepository } from "@/modules/candidates/repository/candidate-repository";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ runId?: string }> };

export default async function CandidateComparisonPage({ params, searchParams }: PageProps) {
  const { id: missionId } = await params;
  const { runId: runIdParam } = await searchParams;
  if (!process.env.DATABASE_URL) notFound();

  const mission = await createMissionRepository(prisma).getMissionById(missionId);
  if (!mission) notFound();

  const run = runIdParam
    ? await prisma.generationRun.findFirst({
        where: { id: runIdParam, missionId },
        include: {
          candidates: true,
          mutationPlans: true,
          fingerprintVersion: {
            include: { fingerprint: { include: { sourceQuestion: true } } },
          },
        },
      })
    : await prisma.generationRun.findFirst({
        where: { missionId },
        orderBy: { createdAt: "desc" },
        include: {
          candidates: true,
          mutationPlans: true,
          fingerprintVersion: {
            include: { fingerprint: { include: { sourceQuestion: true } } },
          },
        },
      });

  if (!run || run.candidates.length === 0) notFound();

  const candidateRepo = createCandidateRepository(prisma);
  const siblings = await Promise.all(
    run.candidates.map(async (c) => {
      const bundle = await candidateRepo.getCandidateBundle(c.id);
      const plan = mutationPlanSchema.parse(
        run.mutationPlans.find((p) => p.id === c.mutationPlanId)?.payload,
      );
      const verification = await candidateRepo.getLatestVerification(c.id);
      return {
        id: c.id,
        siblingIndex: c.siblingIndex,
        pipelineStatus: c.status,
        draft: generatedQuestionSchema.parse(bundle.draft),
        distractorAnalysis: bundle.distractorAnalysis
          ? distractorAnalysisSchema.parse(bundle.distractorAnalysis)
          : null,
        verification,
        plan,
      };
    }),
  );

  const rows = buildSiblingComparisonMatrix(siblings);
  const candidateLabels = Object.fromEntries(
    siblings.map((s) => [s.id, `Cand ${String.fromCharCode(65 + s.siblingIndex)}`]),
  );
  const stemExcerpts = Object.fromEntries(siblings.map((s) => [s.id, s.draft.stem.questionText]));
  const sourceStem =
    (run.fingerprintVersion?.fingerprint?.sourceQuestion?.structured as { stemText?: string })
      ?.stemText ?? undefined;

  return (
    <StudioShell
      missionId={mission.id}
      missionTitle={mission.title}
      activePhase="CANDIDATES"
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">S10 · Candidate comparison</p>
          <h1 className="text-display mt-1">Mechanism matrix</h1>
        </>
      }
    >
      <CandidateComparisonMatrix
        missionId={missionId}
        runId={run.id}
        fingerprintVersionLabel={`v${run.fingerprintVersion?.versionNumber ?? "?"}`}
        rows={rows}
        candidateLabels={candidateLabels}
        stemExcerpts={stemExcerpts}
        sourceStem={sourceStem}
      />
    </StudioShell>
  );
}
