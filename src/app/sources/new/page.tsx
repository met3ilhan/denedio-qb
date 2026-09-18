import { SourceUploadWizard } from "@/components/sources/SourceUploadWizard";
import { StudioShell } from "@/components/studio/StudioShell";
import { tr } from "@/shared/copy/tr";

export default function SourceUploadPage() {
  return (
    <StudioShell activePhase="INTAKE" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">{tr.upload.page.screen}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            {tr.upload.page.title}
          </h1>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <SourceUploadWizard />
        <aside className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4 text-sm text-[var(--qs-text-muted)]">
          <p className="font-semibold text-[var(--qs-text)]">{tr.upload.requirementsTitle}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
            {tr.upload.requirements.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      </div>
    </StudioShell>
  );
}
