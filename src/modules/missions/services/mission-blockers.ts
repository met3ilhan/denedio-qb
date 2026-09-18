import type { PrismaClient } from "@/shared/db/client";

export type BlockerSeverity = "P0" | "P1" | "P2";

export type MissionBlocker = {
  id: string;
  severity: BlockerSeverity;
  title: string;
  detail: string;
  href: string;
  missionId: string;
};

export async function listMissionBlockers(
  db: PrismaClient,
  missionId: string,
): Promise<MissionBlocker[]> {
  const blockers: MissionBlocker[] = [];

  const mission = await db.mission.findUnique({
    where: { id: missionId },
    include: {
      sourceFiles: {
        include: {
          extractionJobs: { orderBy: { createdAt: "desc" }, take: 1 },
          sourceQuestions: {
            include: {
              pedagogicalFingerprint: {
                include: { versions: { where: { status: "LOCKED" }, take: 1 } },
              },
            },
          },
        },
      },
      generationRuns: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          candidates: {
            include: {
              verifierRuns: { where: { stale: false }, orderBy: { createdAt: "desc" }, take: 1 },
              generatedQuestion: {
                include: {
                  denedioMapping: true,
                  exportAttempts: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mission) return blockers;

  const hasSource = mission.sourceFiles.length > 0;
  if (!hasSource) {
    blockers.push({
      id: `${missionId}-intake`,
      severity: "P1",
      title: "No source intake",
      detail: "Upload a source file to start the mission thread.",
      href: "/sources/new",
      missionId,
    });
  }

  const latestJob = mission.sourceFiles[0]?.extractionJobs[0];
  if (hasSource && latestJob?.status !== "SUCCEEDED") {
    blockers.push({
      id: `${missionId}-extraction`,
      severity: "P0",
      title: "Extraction incomplete",
      detail: `Latest job status: ${latestJob?.status ?? "missing"}`,
      href: mission.sourceFiles[0] ? `/sources/${mission.sourceFiles[0].id}/extraction` : "/sources",
      missionId,
    });
  }

  const lockedFp = mission.sourceFiles.some((sf) =>
    sf.sourceQuestions.some((sq) =>
      sq.pedagogicalFingerprint?.versions.some((v) => v.status === "LOCKED"),
    ),
  );
  if (hasSource && !lockedFp && mission.phase !== "INTAKE") {
    blockers.push({
      id: `${missionId}-fingerprint`,
      severity: "P0",
      title: "Fingerprint not locked",
      detail: "Lock pedagogical fingerprint before generation (S07).",
      href: mission.sourceFiles[0]
        ? `/sources/${mission.sourceFiles[0].id}/fingerprint/draft`
        : `/missions/${missionId}`,
      missionId,
    });
  }

  for (const run of mission.generationRuns) {
    for (const candidate of run.candidates) {
      const verification = candidate.verifierRuns[0]?.result as
        | { quality_gate?: string }
        | undefined;
      if (candidate.status !== "APPROVED" && verification?.quality_gate === "GATE_FAIL") {
        blockers.push({
          id: `${candidate.id}-verify`,
          severity: "P0",
          title: "Verification FAIL",
          detail: `Candidate ${candidate.id.slice(0, 8)}… blocked approval.`,
          href: `/candidates/${candidate.id}/verification`,
          missionId,
        });
      }

      const gq = candidate.generatedQuestion;
      if (gq) {
        if (!gq.denedioMapping) {
          blockers.push({
            id: `${gq.id}-mapping`,
            severity: "P1",
            title: "Catalog mapping missing",
            detail: "Complete Denedio field mapping before export (S17).",
            href: `/questions/${gq.id}/denedio/map`,
            missionId,
          });
        }
        const latestExport = gq.exportAttempts[0];
        if (!latestExport?.passed) {
          blockers.push({
            id: `${gq.id}-dry-run`,
            severity: "P0",
            title: "Dry-run not passed",
            detail: "Run local import validation on S18 before export bundle.",
            href: `/questions/${gq.id}/denedio/dry-run`,
            missionId,
          });
        }
      }
    }
  }

  const rank: Record<BlockerSeverity, number> = { P0: 0, P1: 1, P2: 2 };
  return blockers.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export async function listHomeMissionSummaries(db: PrismaClient) {
  const missions = await db.mission.findMany({
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const summaries = [];
  for (const mission of missions) {
    const blockers = await listMissionBlockers(db, mission.id);
    summaries.push({
      id: mission.id,
      title: mission.title,
      phase: mission.phase,
      updatedAt: mission.updatedAt.toISOString(),
      blockerCount: blockers.length,
      topBlocker: blockers[0] ?? null,
    });
  }
  return summaries;
}
