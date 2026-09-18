import Link from "next/link";

import type { listHomeMissionSummaries } from "@/modules/missions/services/mission-blockers";

type MissionSummary = Awaited<ReturnType<typeof listHomeMissionSummaries>>[number];

type MissionStreamHomeProps = {
  missions: MissionSummary[];
};

export function MissionStreamHome({ missions }: MissionStreamHomeProps) {
  const latest = missions[0];

  return (
    <section className="min-w-0 space-y-4" aria-label="Mission stream" data-testid="mission-stream">
      {missions.length === 0 ? (
        <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--qs-text)]">No missions yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--qs-text-muted)]">
            Start with a source intake to open a mission thread.
          </p>
          <Link
            href="/sources/new"
            className="mt-4 inline-flex rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white"
          >
            New source intake
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--qs-text)]">Active missions</h2>
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
                      {mission.phase} · {mission.blockerCount} blocker(s)
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
              Continue last mission
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
