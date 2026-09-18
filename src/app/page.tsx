import { StudioShell } from "@/components/studio/StudioShell";
import { MissionStreamHome } from "@/components/studio/MissionStreamHome";
import { listHomeMissionSummaries } from "@/modules/missions/services/mission-blockers";
import { prisma } from "@/shared/db/client";

export default async function HomePage() {
  const missions = process.env.DATABASE_URL
    ? await listHomeMissionSummaries(prisma)
    : [];

  const aggregateBlockers = missions
    .filter((m) => m.topBlocker)
    .map((m) => m.topBlocker!)
    .slice(0, 5);

  return (
    <StudioShell showBlockers blockers={aggregateBlockers}>
      <MissionStreamHome missions={missions} />
    </StudioShell>
  );
}
