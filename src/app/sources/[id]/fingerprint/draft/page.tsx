import Link from "next/link";

import { StudioShell } from "@/components/studio/StudioShell";

type PageProps = { params: Promise<{ id: string }> };

export default async function FingerprintDraftStubPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <StudioShell activePhase="MECHANISM" showBlockers={false}
      header={
        <>
          <p className="font-mono text-xs text-[var(--qs-text-muted)]">S06 · Fingerprint Draft</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-[28px]">
            Fingerprint draft (P08)
          </h1>
        </>
      }
    >
      <p className="text-sm text-[var(--qs-text-muted)]">
        Extraction accepted for source <span className="font-mono">{id}</span>. Fingerprint inference
        ships in Gate 3 (P08).
      </p>
      <Link href="/sources" className="mt-4 inline-block text-sm text-[var(--qs-phase-intake)] underline">
        Back to sources library
      </Link>
    </StudioShell>
  );
}
