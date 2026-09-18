"use client";

import { useState } from "react";

import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";

type CandidateInspectorWorkspaceProps = {
  candidateId: string;
  initialDraft: GeneratedQuestion;
  initialDistractor: DistractorAnalysis | null;
  verificationStaleAt: string | null;
};

export function CandidateInspectorWorkspace({
  candidateId,
  initialDraft,
  initialDistractor,
  verificationStaleAt,
}: CandidateInspectorWorkspaceProps) {
  const [stem, setStem] = useState(initialDraft.stem.questionText);
  const [choices, setChoices] = useState(initialDraft.choices);
  const [message, setMessage] = useState<string | null>(null);
  const [stale, setStale] = useState(verificationStaleAt);

  async function save() {
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stemText: stem, choices }),
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
      <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Stem & choices (S11)</h2>
        {stale ? (
          <p className="mt-2 text-sm text-amber-700" data-testid="verification-stale-banner">
            Verification stale — re-run verifier before approval.
          </p>
        ) : null}
        <textarea
          className="text-body mt-3 min-h-[120px] w-full rounded-md border border-[var(--qs-border)] p-3"
          value={stem}
          onChange={(e) => setStem(e.target.value)}
        />
        <ul className="mt-4 space-y-2">
          {choices.map((choice, idx) => (
            <li key={choice.label} className="flex gap-2">
              <span className="text-mono w-6">{choice.label}</span>
              <input
                className="flex-1 rounded-md border border-[var(--qs-border)] px-2 py-1 text-sm"
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
