import { notFound } from "next/navigation";

import { StudioShell } from "@/components/studio/StudioShell";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { prisma } from "@/shared/db/client";

type PageProps = { params: Promise<{ id: string }> };

export default async function QuestionRecordPage({ params }: PageProps) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const question = await prisma.generatedQuestion.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { versionNumber: "asc" } },
      candidate: { include: { generationRun: true } },
    },
  });
  if (!question) notFound();

  const latest = question.versions[question.versions.length - 1];
  const content = latest ? generatedQuestionSchema.parse(latest.content) : null;

  return (
    <StudioShell
      missionId={question.candidate.generationRun.missionId}
      activePhase="SHIP"
      header={
        <>
          <p className="text-mono text-[var(--qs-text-muted)]">S14 · Question record</p>
          <h1 className="text-display mt-1">Approved question</h1>
        </>
      }
    >
      <div data-testid="question-record">
        <p className="text-mono text-sm">{question.importExternalKey}</p>
        {content ? (
          <p className="text-body mt-4">{content.stem.questionText}</p>
        ) : null}
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href={`/questions/${question.id}/denedio/map`} className="underline">S17 mapping</a>
          <a href={`/questions/${question.id}/denedio/dry-run`} className="underline">S18 dry-run</a>
          <a href="/catalog" className="underline">S16 catalog</a>
        </nav>
        <section className="mt-6">
          <h2 className="text-title">Version history (S15)</h2>
          <ul className="mt-2 text-sm">
            {question.versions.map((v) => (
              <li key={v.id} data-testid={`version-${v.versionNumber}`}>
                v{v.versionNumber} · {v.verificationState} · {v.approvalState}
                {v.revisionReason ? ` · ${v.revisionReason}` : ""} · {v.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </StudioShell>
  );
}
