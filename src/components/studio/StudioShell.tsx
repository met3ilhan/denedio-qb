import type { MissionPhase } from "@prisma/client";
import type { ReactNode } from "react";

import { BlockersPanel } from "./BlockersPanel";
import { CommandPaletteStub } from "./CommandPaletteStub";
import { PhasePill } from "./PhasePill";
import { StudioRail } from "./StudioRail";

type StudioShellProps = {
  children: ReactNode;
  missionId?: string;
  missionTitle?: string;
  activePhase?: MissionPhase;
  showBlockers?: boolean;
  header?: ReactNode;
};

export function StudioShell({
  children,
  missionId,
  missionTitle,
  activePhase = "INTAKE",
  showBlockers = true,
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
        <header
          className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--qs-border)] bg-[var(--qs-surface)] px-4 py-4 sm:px-6"
        >
          <div className="min-w-0 flex-1">
            {header ?? (
              <>
                <p className="font-mono text-xs text-[var(--qs-text-muted)]">S01 · Mission Board</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px] sm:leading-[34px]">
                  Mission stream
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
          {showBlockers ? <BlockersPanel /> : null}
        </div>
      </div>

      <CommandPaletteStub />
    </div>
  );
}
