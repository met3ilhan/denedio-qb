const phases = [
  { id: "intake", label: "Intake", color: "bg-[#2563EB]" },
  { id: "mechanism", label: "Mechanism", color: "bg-[#7C3AED]" },
  { id: "candidates", label: "Candidates", color: "bg-[#D97706]" },
  { id: "ship", label: "Ship", color: "bg-[#059669]" },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <aside
        className="flex w-60 shrink-0 flex-col border-r border-hairline bg-panel"
        aria-label="Studio rail"
      >
        <div className="border-b border-hairline px-4 py-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Question Studio
          </p>
          <h1 className="mt-1 text-sm font-semibold text-ink">Pedagogy Signal Lab</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted"
            >
              <span
                className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${phase.color}`}
                aria-hidden
              />
              <span className="pl-2">{phase.label}</span>
            </div>
          ))}
        </nav>
        <p className="border-t border-hairline px-4 py-3 font-mono text-[10px] text-ink-muted">
          Gate 2 scaffold · missions S01+ pending
        </p>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="border-b border-hairline bg-panel px-8 py-6">
          <p className="font-mono text-xs text-ink-muted">MISSION / STANDBY</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Instrumentation for judgment
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Turn licensed source items into pedagogically faithful generated questions—with
            auditable fingerprints, independent verification, and Denedio-shaped export. Full
            expert workflow ships in later gates; this build establishes the studio foundation.
          </p>
        </header>

        <section className="grid flex-1 gap-4 p-8 md:grid-cols-2">
          <article className="rounded-lg border border-hairline bg-panel p-5">
            <h3 className="text-sm font-semibold text-ink">Provenance chain</h3>
            <p className="mt-2 font-mono text-xs leading-relaxed text-ink-muted">
              source → fingerprint (locked) → generation run → mutation plan → candidate →
              solver → verifier → approval → export payload
            </p>
          </article>
          <article className="rounded-lg border border-hairline bg-panel p-5">
            <h3 className="text-sm font-semibold text-ink">Quality bar</h3>
            <ul className="mt-2 space-y-1 text-sm text-ink-muted">
              <li>Zod at AI and API boundaries (upcoming)</li>
              <li>No paraphrase-only generation path</li>
              <li>No Denedio production database connection</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
