"use client";

import { useMemo, useState } from "react";

import { DistractorCausalityEditor } from "@/components/candidates/DistractorCausalityEditor";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import { difficultyLabel, tr } from "@/shared/copy/tr";
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
  const [distractor, setDistractor] = useState<DistractorAnalysis | null>(initialDistractor);
  const [message, setMessage] = useState<string | null>(null);
  const [stale, setStale] = useState(verificationStaleAt);

  const wrongLabels = useMemo(
    () => choices.filter((c) => !c.isCorrect).map((c) => c.label),
    [choices],
  );
  const [selectedDistractorLabel, setSelectedDistractorLabel] = useState<string>(
    wrongLabels[0] ?? "B",
  );

  const draftForCausality: GeneratedQuestion = {
    ...initialDraft,
    stem: { ...initialDraft.stem, questionText: stem },
    choices,
    solution: { ...initialDraft.solution, solutionText },
  };

  function setCorrect(label: string) {
    setChoices((prev) => prev.map((c) => ({ ...c, isCorrect: c.label === label })));
  }

  async function save() {
    const payload: Record<string, unknown> = {
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
    };
    if (distractor) {
      payload.distractorAnalysis = distractor;
    }

    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { verificationStaleAt?: string; error?: string };
    if (data.error) {
      setMessage(data.error);
      return;
    }
    setStale(data.verificationStaleAt ?? null);
    setMessage(data.verificationStaleAt ? tr.candidates.savedStale : tr.candidates.saved);
  }

  return (
    <div className="grid min-w-0 gap-6" data-testid="candidate-inspector">
      {sourceStem ? (
        <aside
          className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-4"
          data-testid="expert-source-context"
        >
          <h2 className="text-sm font-semibold">{tr.candidates.sourceMeasurement}</h2>
          <p className="text-stem mt-2">{sourceStem}</p>
          {lockedInvariantSummary.length ? (
            <div className="mt-3">
              <h3 className="text-xs font-medium text-[var(--qs-text-muted)]">{tr.candidates.lockedInvariants}</h3>
              <ul className="mt-1 list-disc pl-5 text-body text-sm">
                {lockedInvariantSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {fingerprintVersionId ? (
            <a href={`/fingerprint/${fingerprintVersionId}`} className="mt-2 inline-block text-sm underline">
              {tr.fingerprint.openReviewS07}
            </a>
          ) : null}
        </aside>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
            <h2 className="text-title text-[var(--qs-text)]">{tr.candidates.expertEditor}</h2>
            {stale ? (
              <p className="mt-2 text-sm text-amber-700" data-testid="verification-stale-banner">
                {tr.candidates.verificationStale}
              </p>
            ) : null}
            <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">{tr.candidates.questionStem}</label>
            <textarea
              className="text-stem mt-1 min-h-[120px] w-full rounded-md border border-[var(--qs-border)] p-3"
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              data-testid="expert-stem"
            />
            <label className="mt-4 block text-xs font-medium text-[var(--qs-text-muted)]">{tr.candidates.solution}</label>
            <textarea
              className="text-body mt-1 min-h-[80px] w-full rounded-md border border-[var(--qs-border)] p-3"
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              data-testid="expert-solution"
            />
            <h3 className="mt-4 text-sm font-semibold">{tr.candidates.choices}</h3>
            <ul className="mt-2 space-y-2">
              {choices.map((choice, idx) => (
                <li key={choice.label} className="flex flex-wrap items-center gap-2">
                  <input
                    type="radio"
                    name="correct-choice"
                    checked={choice.isCorrect}
                    onChange={() => setCorrect(choice.label)}
                    aria-label={tr.candidates.markCorrect(choice.label)}
                  />
                  <span className="text-mono w-6">{choice.label}</span>
                  <input
                    className="text-stem min-w-0 flex-1 rounded-md border border-[var(--qs-border)] px-2 py-2"
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
                <label className="text-xs font-medium text-[var(--qs-text-muted)]">{tr.candidates.difficulty}</label>
                <select
                  className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                >
                  <option value="EASY">{difficultyLabel("EASY")}</option>
                  <option value="MEDIUM">{difficultyLabel("MEDIUM")}</option>
                  <option value="HARD">{difficultyLabel("HARD")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--qs-text-muted)]">{tr.candidates.expectedSolveSec}</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
                  value={solveSeconds}
                  onChange={(e) => setSolveSeconds(e.target.value)}
                />
              </div>
            </div>
            <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">{tr.terms.criticalSignal}</label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
              value={criticalClue}
              onChange={(e) => setCriticalClue(e.target.value)}
            />
            <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">{tr.candidates.idealApproach}</label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
              value={idealApproach}
              onChange={(e) => setIdealApproach(e.target.value)}
            />
            <button
              type="button"
              onClick={save}
              className="mt-4 min-h-11 rounded-md bg-[var(--qs-phase-candidates)] px-4 py-2 text-sm font-medium text-white"
              data-testid="expert-save-edits"
            >
              {tr.candidates.saveEdits}
            </button>
            {message ? <p className="text-body mt-2 text-[var(--qs-text-muted)]">{message}</p> : null}
          </section>

          {distractor && wrongLabels.length > 0 ? (
            <nav
              className="flex flex-wrap gap-2 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
              aria-label={tr.candidates.wrongChoiceRailAria}
              data-testid="distractor-choice-rail"
            >
              {wrongLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedDistractorLabel(label)}
                  className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium ${
                    label === selectedDistractorLabel
                      ? "bg-[var(--qs-phase-candidates)] text-white"
                      : "border border-[var(--qs-border)] bg-[var(--qs-canvas)]"
                  }`}
                  data-testid={`distractor-rail-${label}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>

        <section
          className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4 lg:sticky lg:top-4"
          data-testid="distractor-editor-panel"
        >
          <h2 className="text-title text-[var(--qs-text)]">{tr.candidates.causalityDrawer}</h2>
          <p className="text-body mt-1 text-[var(--qs-text-muted)]">{tr.candidates.causalityHint}</p>
          {distractor ? (
            <DistractorCausalityEditor
              draft={draftForCausality}
              distractor={distractor}
              onChange={setDistractor}
              selectedLabel={selectedDistractorLabel}
              onSelectLabel={setSelectedDistractorLabel}
              showRail={false}
            />
          ) : (
            <p className="mt-4 text-sm text-[var(--qs-text-muted)]">{tr.candidates.noDistractorAnalysis}</p>
          )}
        </section>
      </div>
    </div>
  );
}
