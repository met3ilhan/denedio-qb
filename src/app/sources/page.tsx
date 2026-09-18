import Link from "next/link";

import { SourcesLibraryTable } from "@/components/sources/SourcesLibraryTable";
import { StudioShell } from "@/components/studio/StudioShell";

export default function SourcesLibraryPage() {
  return (
    <StudioShell activePhase="INTAKE" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S02 · Sources Library</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            Sources corpus
          </h1>
        </>
      }
    >
      <div className="mb-4 flex justify-end">
        <Link
          href="/sources/new"
          className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white"
        >
          New source intake
        </Link>
      </div>
      <SourcesLibraryTable />
    </StudioShell>
  );
}
