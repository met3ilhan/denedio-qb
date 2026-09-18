"use client";

import { useState } from "react";

import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";

type CandidateInspectorWorkspaceProps = {
  candidateId: string;
  initialDraft: GeneratedQuestion;
  initialDistractor: DistractorAnalysis | null;
  verificationStaleAt: string | null;
  sourceStem?: string;
  lockedInvariantSummary?: string[];
  fingerprintVersionId?: string;
};

export function CandidateInspectorWorkspace({
  candidateId,
  initialDraft,
  initialDistractor,
  verificationStaleAt,
  sourceStem,
  lockedInvariantSummary = [],
  fingerprintVersionId,
}: CandidateInspectorWorkspaceProps) {
  const [stem, setStem] = useState(initialDraft.stem.questionText);
  const [choices, setChoices] = useState(initialDraft.choices);
  const [solutionText, setSolutionText] = useState(initialDraft.solution.solutionText);
  const [criticalClue, setCriticalClue] = useState(initialDraft.metadata?.criticalClue ?? "");
  const [idealApproach, setIdealApproach] = useState(initialDraft.metadata?.idealApproach ?? "");
  const [difficulty, setDifficulty] = useState(initialDraft.metadata?.difficulty ?? "MEDIUM");
  const [solveSeconds, setSolveSeconds] = useState(
    String(initialDraft.metadata?.expectedSolveTimeSeconds ?? 120),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [stale, setStale] = useState(verificationStaleAt);

  function setCorrect(label: string) {
    setChoices((prev) => prev.map((c) => ({ ...c, isCorrect: c.label === label })));
  }

  async function save() {
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stemText: stem,
        choices,
        solutionText,
        metadata: {
          ...initialDraft.metadata,
          criticalClue: criticalClue || undefined,
          idealApproach: idealApproach || undefined,
          difficulty,
          expectedSolveTimeSeconds: Number.parseInt(solveSeconds, 10) || 120,
        },
      }),
    });
    const data = (await res.json()) as { verificationStaleAt?: string; error?: string };
    if (data.error) {
      setMessage(data.error);
      return;
    }
    setStale(data.verificationStaleAt ?? null);
    setMessage(data.verificationStaleAt ? "Saved — verification invalidated." : "Saved.");
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-testid="candidate-inspector">
      {sourceStem ? (
        <aside
          className="lg:col-span-2 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-4"
          data-testid="expert-source-context"
        >
          <h2 className="text-sm font-semibold">Source measurement (read-only)</h2>
          <p className="text-body mt-2 text-sm">{sourceStem}</p>
          {lockedInvariantSummary.length ? (
            <div className="mt-3">
              <h3 className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]">Locked invariants</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {lockedInvariantSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {fingerprintVersionId ? (
            <a href={`/fingerprint/${fingerprintVersionId}`} className="mt-2 inline-block text-sm underline">
              Open fingerprint review (S07)
            </a>
          ) : null}
        </aside>
      ) : null}
      <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Expert editor (S11)</h2>
        {stale ? (
          <p className="mt-2 text-sm text-amber-700" data-testid="verification-stale-banner">
            Verification stale — re-run verifier before approval.
          </p>
        ) : null}
        <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">Question stem</label>
        <textarea
          className="text-body mt-1 min-h-[120px] w-full rounded-md border border-[var(--qs-border)] p-3"
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          data-testid="expert-stem"
        />
        <label className="mt-4 block text-xs font-medium text-[var(--qs-text-muted)]">Solution</label>
        <textarea
          className="text-body mt-1 min-h-[80px] w-full rounded-md border border-[var(--qs-border)] p-3"
          value={solutionText}
          onChange={(e) => setSolutionText(e.target.value)}
          data-testid="expert-solution"
        />
        <h3 className="mt-4 text-sm font-semibold">Choices</h3>
        <ul className="mt-2 space-y-2">
          {choices.map((choice, idx) => (
            <li key={choice.label} className="flex flex-wrap items-center gap-2">
              <input
                type="radio"
                name="correct-choice"
                checked={choice.isCorrect}
                onChange={() => setCorrect(choice.label)}
                aria-label={`Mark ${choice.label} correct`}
              />
              <span className="text-mono w-6">{choice.label}</span>
              <input
                className="min-w-0 flex-1 rounded-md border border-[var(--qs-border)] px-2 py-1 text-sm"
                value={choice.text}
                onChange={(e) => {
                  const next = [...choices];
                  next[idx] = { ...choice, text: e.target.value };
                  setChoices(next);
                }}
              />
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">Difficulty</label>
            <select
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
            >
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">Expected solve (sec)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
              value={solveSeconds}
              onChange={(e) => setSolveSeconds(e.target.value)}
            />
          </div>
        </div>
        <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">Critical signal</label>
        <textarea
          className="mt-1 w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
          value={criticalClue}
          onChange={(e) => setCriticalClue(e.target.value)}
        />
        <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">Ideal approach</label>
        <textarea
          className="mt-1 w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
          value={idealApproach}
          onChange={(e) => setIdealApproach(e.target.value)}
        />
        <button
          type="button"
          onClick={save}
          className="mt-4 rounded-md bg-[var(--qs-phase-candidates)] px-3 py-2 text-sm font-medium text-white"
        >
          Save edits
        </button>
        {message ? <p className="text-body mt-2 text-[var(--qs-text-muted)]">{message}</p> : null}
      </section>

      <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Distractor causality</h2>
        <p className="text-body mt-1 text-[var(--qs-text-muted)]">MECH_* roles and error paths per wrong choice.</p>
        {initialDistractor ? (
          <ul className="mt-4 space-y-3">
            {initialDistractor.wrong_choices.map((w) => (
              <li
                key={w.choice_label}
                className="rounded-md border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-3 text-sm"
                data-testid={`distractor-meta-${w.choice_label}`}
              >
                <p className="font-medium">
                  {w.choice_label} · {w.mechanism_id}
                </p>
                <p className="text-[var(--qs-text-muted)]">{w.misconception_id}</p>
                <p className="mt-1">→ {w.produces_value}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--qs-text-muted)]">No distractor analysis yet.</p>
        )}
      </section>
    </div>
  );
}
