import type { MissionPhase } from "@prisma/client";
import type { ReactNode } from "react";

import type { MissionBlocker } from "@/modules/missions/services/mission-blockers";
import { tr } from "@/shared/copy/tr";

import { BlockersPanel } from "./BlockersPanel";
import { ProviderModeBanner } from "./ProviderModeBanner";
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
  headerActions?: ReactNode;
};

export function StudioShell({
  children,
  missionId,
  missionTitle,
  activePhase = "INTAKE",
  showBlockers = true,
  blockers,
  header,
  headerActions,
}: StudioShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[var(--qs-canvas)] md:flex-row">
      <StudioRail
        missionId={missionId}
        activePhase={activePhase}
        missionTitle={missionTitle}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ProviderModeBanner />
        <header
          className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--qs-border)] bg-[var(--qs-surface)] px-4 py-4 sm:px-6"
        >
          <div className="min-w-0 flex-1">
            {header ?? (
              <>
                <p className="text-xs text-[var(--qs-text-muted)]">{tr.shell.missionBoard}</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px] sm:leading-[34px]">
                  {tr.shell.missionStream}
                </h1>
              </>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {headerActions}
            <PhasePill phase={activePhase} />
          </div>
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
