import Link from "next/link";

import { tr } from "@/shared/copy/tr";

export function HomeProductIntro() {
  return (
    <section
      className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5"
      data-testid="home-product-intro"
      aria-label={tr.home.introAria}
    >
      <h2 className="text-lg font-semibold text-[var(--qs-text)]">{tr.home.introTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--qs-text-muted)]">{tr.home.introBody}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--qs-text-muted)]">
        {tr.home.introBullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/sources/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[var(--qs-phase-intake)] px-4 py-2.5 text-sm font-semibold text-white"
          data-testid="new-source-intake"
        >
          {tr.home.primaryCta}
        </Link>
        <Link
          href="/sources"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[var(--qs-border)] px-4 py-2 text-sm font-medium text-[var(--qs-text)]"
          data-testid="home-sources-library"
        >
          {tr.home.secondarySources}
        </Link>
      </div>
    </section>
  );
}
