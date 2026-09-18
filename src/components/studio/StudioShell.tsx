import type { MissionPhase } from "@prisma/client";
import type { ReactNode } from "react";

import type { MissionBlocker } from "@/modules/missions/services/mission-blockers";
import { isDemoMode } from "@/shared/ai/demo";
import { tr } from "@/shared/copy/tr";

import { BlockersPanel } from "./BlockersPanel";
import { MissionBlockersPanel } from "./MissionBlockersPanel";
import { CommandPaletteStub } from "./CommandPaletteStub";
import { PhasePill } from "./PhasePill";
import { StudioRail } from "./StudioRail";

type StudioShellProps = {
  children: ReactNode;
  missionId?: string;
  missionTitle?: string;
  activePhase?: MissionPhase;
  showBlockers?: boolean;
  blockers?: MissionBlocker[];
  header?: ReactNode;
};

export function StudioShell({
  children,
  missionId,
  missionTitle,
  activePhase = "INTAKE",
  showBlockers = true,
  blockers,
  header,
}: StudioShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[var(--qs-canvas)] md:flex-row">
      <StudioRail
        missionId={missionId}
        activePhase={activePhase}
        missionTitle={missionTitle}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {isDemoMode() ? (
          <div
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6"
            data-testid="demo-mode-banner"
            role="status"
          >
            <span className="font-semibold">{tr.demo.badge}</span>
            <span className="ml-2 text-amber-900">{tr.demo.body}</span>
          </div>
        ) : null}
        <header
          className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--qs-border)] bg-[var(--qs-surface)] px-4 py-4 sm:px-6"
        >
          <div className="min-w-0 flex-1">
            {header ?? (
              <>
                <p className="font-mono text-xs text-[var(--qs-text-muted)]">{tr.shell.missionBoard}</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px] sm:leading-[34px]">
                  {tr.shell.missionStream}
                </h1>
              </>
            )}
          </div>
          <PhasePill phase={activePhase} />
        </header>

        <div
          className={`grid min-w-0 flex-1 gap-4 p-4 sm:p-6 ${
            showBlockers ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]" : ""
          }`}
        >
          <div className="min-w-0">{children}</div>
          {showBlockers ? (
            blockers ? <MissionBlockersPanel blockers={blockers} /> : <BlockersPanel />
          ) : null}
        </div>
      </div>

      <CommandPaletteStub />
    </div>
  );
}
