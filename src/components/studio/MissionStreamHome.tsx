import Link from "next/link";

import { MISSION_PHASE_LABELS } from "@/modules/missions/domain/mission-phase";
import type { listHomeMissionSummaries } from "@/modules/missions/services/mission-blockers";
import { tr } from "@/shared/copy/tr";

type MissionSummary = Awaited<ReturnType<typeof listHomeMissionSummaries>>[number];

type MissionStreamHomeProps = {
  missions: MissionSummary[];
};

export function MissionStreamHome({ missions }: MissionStreamHomeProps) {
  const latest = missions[0];

  return (
    <section className="min-w-0 space-y-4" aria-label={tr.mission.streamAria} data-testid="mission-stream">
      {missions.length === 0 ? (
        <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--qs-text)]">{tr.mission.noMissionsTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--qs-text-muted)]">
            {tr.mission.noMissionsBody}
          </p>
          <Link
            href="/sources/new"
            className="mt-4 inline-flex rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white"
          >
            {tr.mission.newSourceIntake}
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--qs-text)]">{tr.mission.activeMissions}</h2>
            <ul className="mt-3 space-y-2">
              {missions.map((mission) => (
                <li
                  key={mission.id}
                  data-testid="mission-row"
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--qs-border)] px-3 py-2 text-sm"
                >
                  <div>
                    <Link href={`/missions/${mission.id}`} className="font-medium underline">
                      {mission.title}
                    </Link>
                    <p className="text-xs text-[var(--qs-text-muted)]">
                      {MISSION_PHASE_LABELS[mission.phase]} · {tr.blockers.count(mission.blockerCount)}
                    </p>
                  </div>
                  {mission.topBlocker ? (
                    <span className="font-mono text-xs text-red-700">{mission.topBlocker.severity}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          {latest ? (
            <Link
              href={`/missions/${latest.id}`}
              data-testid="continue-last-mission"
              className="inline-flex rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm font-medium"
            >
              {tr.mission.continueLast}
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
