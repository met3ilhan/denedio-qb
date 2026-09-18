import { SourceUploadWizard } from "@/components/sources/SourceUploadWizard";
import { StudioShell } from "@/components/studio/StudioShell";

export default function SourceUploadPage() {
  return (
    <StudioShell activePhase="INTAKE" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S03 · Source Upload</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            Intake wizard
          </h1>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <SourceUploadWizard />
        <aside className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4 text-sm text-[var(--qs-text-muted)]">
          <p className="font-semibold text-[var(--qs-text)]">Upload requirements</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
            <li>Max 25 MB per file</li>
            <li>PDF, DOCX, HTML, plain text, images</li>
            <li>Creates a mission thread on submit</li>
          </ul>
        </aside>
      </div>
    </StudioShell>
  );
}
