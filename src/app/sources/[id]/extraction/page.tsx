import { ExtractionJobPanel } from "@/components/sources/ExtractionJobPanel";
import { StudioShell } from "@/components/studio/StudioShell";

type PageProps = { params: Promise<{ id: string }> };

export default async function ExtractionJobPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <StudioShell activePhase="INTAKE" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S04 · Extraction Queue</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            Extraction job
          </h1>
        </>
      }
    >
      <ExtractionJobPanel sourceId={id} />
    </StudioShell>
  );
}
