"use client";

import { useMemo, useState } from "react";

import type { TrivialMutationFlag } from "@/shared/validation/trivial-mutation";

type GenerationSetupWorkspaceProps = {
  missionId: string;
  fingerprintVersionId: string;
  planJson: string;
  initialFlags: TrivialMutationFlag[];
};

export function GenerationSetupWorkspace({
  missionId,
  fingerprintVersionId,
  planJson,
  initialFlags,
}: GenerationSetupWorkspaceProps) {
  const [draftJson, setDraftJson] = useState(planJson);
  const [flags, setFlags] = useState(initialFlags);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flagSummary = useMemo(
    () => flags.map((f) => `${f.code}: ${f.message}`).join("\n"),
    [flags],
  );

  async function previewGuards() {
    setBusy(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/generation/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          fingerprintVersionId,
          plan: JSON.parse(draftJson) as unknown,
        }),
      });
      const data = (await res.json()) as { flags?: TrivialMutationFlag[]; error?: string };
      if (data.error) {
        setMessage(data.error);
        return;
      }
      setFlags(data.flags ?? []);
      setMessage("Preview updated.");
    } catch {
      setMessage("Invalid JSON in mutation plan.");
    } finally {
      setBusy(false);
    }
  }

  async function persistPlan() {
    setBusy(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/generation/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "persist",
          fingerprintVersionId,
          plan: JSON.parse(draftJson) as unknown,
        }),
      });
      const data = (await res.json()) as { error?: string; runId?: string };
      if (data.error) {
        setMessage(data.error);
        return;
      }
      if (data.runId) {
        window.location.href = `/missions/${missionId}/generate/run/${data.runId}`;
        return;
      }
      setMessage("Run saved.");
    } catch {
      setMessage("Invalid JSON in mutation plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      data-testid="generation-setup"
    >
      <section className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Mutation plan</h2>
        <p className="text-body mt-1 text-[var(--qs-text-muted)]">
          Fingerprint version <span className="font-mono">{fingerprintVersionId}</span>
        </p>
        <textarea
          className="text-mono mt-4 min-h-[360px] w-full rounded-md border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-3"
          value={draftJson}
          onChange={(e) => setDraftJson(e.target.value)}
          spellCheck={false}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={previewGuards}
            className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
          >
            Preview trivial-mutation guards
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={persistPlan}
            className="rounded-md bg-[var(--qs-phase-candidates)] px-3 py-2 text-sm font-medium text-white"
          >
            Save plan to run
          </button>
        </div>
        {message ? <p className="text-body mt-3 text-[var(--qs-text-muted)]">{message}</p> : null}
      </section>

      <section className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Trivial mutation preview</h2>
        <p className="text-body mt-1 text-[var(--qs-text-muted)]">
          Heuristic flags for QUESTION_GENERATION_RULES T1–T6 (not Verifier approval).
        </p>
        {flags.length === 0 ? (
          <p
            className="mt-4 rounded-md border border-dashed border-[var(--qs-border)] bg-[var(--qs-canvas)] px-3 py-6 text-center text-sm text-[var(--qs-text-muted)]"
            data-testid="trivial-guards-clear"
          >
            No trivial-mutation flags for this plan.
          </p>
        ) : (
          <ul className="mt-4 space-y-2" data-testid="trivial-guard-flags">
            {flags.map((flag) => (
              <li
                key={`${flag.code}-${flag.message}`}
                className="rounded-md border border-[var(--qs-severity-major)] bg-[var(--qs-mutable-bg)] px-3 py-2 text-sm"
              >
                <span className="font-mono font-semibold">{flag.code}</span> — {flag.message}
              </li>
            ))}
          </ul>
        )}
        <pre className="text-mono mt-4 hidden whitespace-pre-wrap rounded-md bg-[var(--qs-canvas)] p-3 text-[var(--qs-text-muted)] md:block">
          {flagSummary}
        </pre>
      </section>
    </div>
  );
}
