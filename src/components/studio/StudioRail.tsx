"use client";

import Link from "next/link";
import type { MissionPhase } from "@prisma/client";

import { tr } from "@/shared/copy/tr";

import { STUDIO_PHASES } from "./phase-tokens";

type StudioRailProps = {
  missionId?: string;
  activePhase: MissionPhase;
  missionTitle?: string;
};

export function StudioRail({ missionId, activePhase, missionTitle }: StudioRailProps) {
  const homeHref = missionId ? `/missions/${missionId}` : "/";

  return (
    <aside
      className="flex w-full min-w-0 shrink-0 flex-col border-b border-[var(--qs-border)] bg-[var(--qs-surface)] md:w-60 md:border-b-0 md:border-r"
      aria-label={tr.nav.railLabel}
    >
      <div className="border-b border-[var(--qs-border)] px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--qs-text-muted)]">
          {tr.app.productName}
        </p>
        <Link
          href={homeHref}
          className="mt-1 block text-sm font-semibold text-[var(--qs-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--qs-phase-intake)]"
        >
          {tr.app.labName}
        </Link>
        {missionTitle ? (
          <p className="mt-2 truncate text-xs text-[var(--qs-text-muted)]" title={missionTitle}>
            {missionTitle}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1 border-b border-[var(--qs-border)] p-2" aria-label={tr.nav.globalLabel}>
        <Link
          href="/"
          className="rounded-md px-3 py-2 text-sm font-medium text-[var(--qs-text)] hover:bg-[var(--qs-canvas)]"
          data-testid="nav-home"
        >
          {tr.nav.home}
        </Link>
        <Link
          href="/sources/new"
          className="rounded-md px-3 py-2 text-sm font-medium text-[var(--qs-phase-intake)] hover:bg-[var(--qs-phase-intake-50)]"
          data-testid="nav-new-source"
        >
          {tr.home.primaryCta}
        </Link>
        <Link
          href="/sources"
          className="rounded-md px-3 py-2 text-sm text-[var(--qs-text-muted)] hover:bg-[var(--qs-canvas)]"
          data-testid="nav-sources"
        >
          {tr.nav.sourcesArchive}
        </Link>
        <Link
          href="/catalog"
          className="rounded-md px-3 py-2 text-sm text-[var(--qs-text-muted)] hover:bg-[var(--qs-canvas)]"
          data-testid="nav-catalog"
        >
          {tr.nav.catalog}
        </Link>
      </nav>

      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label={tr.nav.phasesLabel}>
        {STUDIO_PHASES.map((phase) => {
          const isActive = phase.phase === activePhase;
          const disabled = !missionId && phase.phase !== "INTAKE";
          const intakeHref = !missionId && phase.phase === "INTAKE" ? "/sources/new" : undefined;

          const inner = (
            <>
              <span
                className={`absolute top-1 bottom-1 left-0 w-1 ${phase.signalClass} ${
                  isActive ? "opacity-100" : "opacity-40"
                }`}
                aria-hidden
              />
              <span className="min-w-0 truncate pl-2">{phase.label}</span>
            </>
          );

          const className = `relative flex min-w-0 items-center rounded-md px-3 py-2 text-sm ${
            isActive
              ? `${phase.tintClass} font-medium text-[var(--qs-text)]`
              : "text-[var(--qs-text-muted)]"
          } ${disabled && !intakeHref ? "opacity-60" : ""}`;

          if (intakeHref) {
            return (
              <Link
                key={phase.id}
                href={intakeHref}
                className={`${className} hover:bg-[var(--qs-phase-intake-50)]`}
                data-testid="nav-phase-intake"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={phase.id}
              className={className}
              title={disabled ? tr.nav.phaseLocked : undefined}
            >
              {inner}
            </div>
          );
        })}
      </nav>

      <div
        className="border-t border-[var(--qs-border)] px-4 py-3"
        aria-label={tr.nav.provenanceTitle}
      >
        <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--qs-text-muted)]">
          {tr.nav.provenanceTitle}
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--qs-text-muted)]">
          {tr.nav.provenanceEmpty}
        </p>
      </div>
    </aside>
  );
}
