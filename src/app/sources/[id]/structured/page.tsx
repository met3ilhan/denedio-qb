import { StructuredReviewPanel } from "@/components/sources/StructuredReviewPanel";
import { StudioShell } from "@/components/studio/StudioShell";

type PageProps = { params: Promise<{ id: string }> };

export default async function StructuredReviewPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <StudioShell activePhase="INTAKE" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S05 · Structured Review</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            Side-by-side review
          </h1>
        </>
      }
    >
      <StructuredReviewPanel sourceId={id} />
    </StudioShell>
  );
}
