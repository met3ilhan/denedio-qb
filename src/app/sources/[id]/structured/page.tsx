import { StructuredReviewPanel } from "@/components/sources/StructuredReviewPanel";
import { StudioShell } from "@/components/studio/StudioShell";
import { tr } from "@/shared/copy/tr";

type PageProps = { params: Promise<{ id: string }> };

export default async function StructuredReviewPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <StudioShell activePhase="INTAKE" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">{tr.structured.page.screen}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            {tr.structured.page.title}
          </h1>
        </>
      }
    >
      <StructuredReviewPanel sourceId={id} />
    </StudioShell>
  );
}
