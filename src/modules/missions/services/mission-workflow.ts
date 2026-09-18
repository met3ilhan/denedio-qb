import type { PrismaClient } from "@/shared/db/client";

import { tr } from "@/shared/copy/tr";

export type WorkflowStepStatus = "done" | "current" | "upcoming" | "blocked";

export type MissionWorkflowStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  status: WorkflowStepStatus;
};

export async function listMissionWorkflowSteps(
  db: PrismaClient,
  missionId: string,
): Promise<MissionWorkflowStep[]> {
  const mission = await db.mission.findUnique({
    where: { id: missionId },
    include: {
      sourceFiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          extractionJobs: { orderBy: { createdAt: "desc" }, take: 1 },
          sourceQuestions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              pedagogicalFingerprint: {
                include: {
                  versions: { orderBy: { versionNumber: "desc" }, take: 3 },
                },
              },
            },
          },
        },
      },
      generationRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          candidates: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { generatedQuestion: true },
          },
        },
      },
    },
  });

  if (!mission) return [];

  const source = mission.sourceFiles[0];
  const job = source?.extractionJobs[0];
  const sq = source?.sourceQuestions.find((q) => q.reviewStatus === "ACCEPTED");
  const accepted = sq?.reviewStatus === "ACCEPTED";
  const fpVersions = sq?.pedagogicalFingerprint?.versions ?? [];
  const lockedFp = fpVersions.find((v) => v.status === "LOCKED");
  const draftFp = fpVersions.find((v) => v.status === "DRAFT");
  const latestRun = mission.generationRuns[0];
  const latestCandidate = latestRun?.candidates[0];

  const steps: Omit<MissionWorkflowStep, "status">[] = [];

  if (!source) {
    steps.push({
      id: "upload",
      label: tr.workflow.upload.label,
      description: tr.workflow.upload.description,
      href: "/sources/new",
    });
  } else {
    steps.push({
      id: "extraction",
      label: tr.workflow.extraction.label,
      description: tr.workflow.extraction.description,
      href: `/sources/${source.id}/extraction`,
    });
    steps.push({
      id: "structured",
      label: tr.workflow.structured.label,
      description: tr.workflow.structured.description,
      href: `/sources/${source.id}/structured`,
    });
    steps.push({
      id: "fingerprint-draft",
      label: tr.workflow.fingerprintDraft.label,
      description: tr.workflow.fingerprintDraft.description,
      href: `/sources/${source.id}/fingerprint/draft`,
    });
    const fpVersionId = lockedFp?.id ?? draftFp?.id;
    if (fpVersionId) {
      steps.push({
        id: "fingerprint-studio",
        label: tr.workflow.fingerprintStudio.label,
        description: tr.workflow.fingerprintStudio.description,
        href: `/fingerprint/${fpVersionId}`,
      });
    }
    steps.push({
      id: "generation",
      label: tr.workflow.generation.label,
      description: tr.workflow.generation.description,
      href: `/missions/${missionId}/generate/setup`,
    });
    if (latestRun) {
      steps.push({
        id: "generation-run",
        label: tr.workflow.generationRun.label,
        description: tr.workflow.generationRun.description,
        href: `/missions/${missionId}/generate/run/${latestRun.id}`,
      });
    }
    steps.push({
      id: "compare",
      label: tr.workflow.compare.label,
      description: tr.workflow.compare.description,
      href: `/missions/${missionId}/candidates/compare`,
    });
    if (latestCandidate) {
      steps.push({
        id: "candidate",
        label: tr.workflow.candidate.label,
        description: tr.workflow.candidate.description,
        href: `/candidates/${latestCandidate.id}`,
      });
      steps.push({
        id: "verification",
        label: tr.workflow.verification.label,
        description: tr.workflow.verification.description,
        href: `/candidates/${latestCandidate.id}/verification`,
      });
      steps.push({
        id: "approval",
        label: tr.workflow.approval.label,
        description: tr.workflow.approval.description,
        href: `/candidates/${latestCandidate.id}/approve`,
      });
      const gqId = latestCandidate.generatedQuestion?.id;
      if (gqId) {
        steps.push({
          id: "dry-run",
          label: tr.workflow.dryRun.label,
          description: tr.workflow.dryRun.description,
          href: `/questions/${gqId}/denedio/dry-run`,
        });
      }
    }
  }

  let currentIndex = 0;
  if (!source) {
    currentIndex = 0;
  } else if (job?.status !== "SUCCEEDED") {
    currentIndex = steps.findIndex((s) => s.id === "extraction");
  } else if (!accepted) {
    currentIndex = steps.findIndex((s) => s.id === "structured");
  } else if (!lockedFp) {
    currentIndex = steps.findIndex((s) => s.id === "fingerprint-draft");
  } else if (!latestRun) {
    currentIndex = steps.findIndex((s) => s.id === "generation");
  } else if (!latestCandidate) {
    currentIndex = steps.findIndex((s) => s.id === "generation-run");
  } else if (latestCandidate.status !== "APPROVED") {
    currentIndex = steps.findIndex((s) => s.id === "candidate");
  } else {
    currentIndex = steps.length - 1;
  }

  if (currentIndex < 0) currentIndex = 0;

  return steps.map((step, index) => {
    let status: WorkflowStepStatus = "upcoming";
    if (index < currentIndex) status = "done";
    else if (index === currentIndex) status = "current";
    if (step.id === "structured" && job?.status !== "SUCCEEDED") status = "blocked";
    if (step.id === "fingerprint-draft" && !accepted) status = "blocked";
    if (step.id === "fingerprint-studio" && !lockedFp && step.id === "fingerprint-studio")
      status = draftFp ? "current" : "blocked";
    if (step.id === "generation" && !lockedFp) status = "blocked";
    return { ...step, status };
  });
}
