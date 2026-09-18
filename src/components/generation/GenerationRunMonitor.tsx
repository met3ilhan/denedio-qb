"use client";

import Link from "next/link";
import { useState } from "react";

type GenerationRunMonitorProps = {
  missionId: string;
  runId: string;
  candidateIds: string[];
  status: string;
};

export function GenerationRunMonitor({
  missionId,
  runId,
  candidateIds: initialIds,
  status: initialStatus,
}: GenerationRunMonitorProps) {
  const [candidateIds, setCandidateIds] = useState(initialIds);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);

  async function spawn() {
    setMessage("Running pipeline…");
    const res = await fetch(`/api/missions/${missionId}/generation/runs/${runId}/spawn`, {
      method: "POST",
    });
    const data = (await res.json()) as { error?: string; candidateIds?: string[] };
    if (data.error) {
      setMessage(data.error);
      return;
    }
    setCandidateIds(data.candidateIds ?? []);
    setStatus("SUCCEEDED");
    setMessage(`Spawned ${data.candidateIds?.length ?? 0} candidate(s).`);
  }

  return (
    <div data-testid="generation-run-monitor">
      <p className="text-mono text-sm text-[var(--qs-text-muted)]">
        Run <span>{runId}</span> · {status}
      </p>
      {status === "READY" ? (
        <button
          type="button"
          onClick={spawn}
          className="mt-4 rounded-md bg-[var(--qs-phase-candidates)] px-3 py-2 text-sm font-medium text-white"
          data-testid="spawn-candidates"
        >
          Spawn candidates (S09)
        </button>
      ) : null}
      {message ? <p className="text-body mt-2">{message}</p> : null}
      {candidateIds.length > 1 ? (
        <Link
          href={`/missions/${missionId}/candidates/compare?runId=${runId}`}
          className="mt-4 inline-block text-sm underline"
          data-testid="open-s10-compare"
        >
          Open S10 comparison matrix
        </Link>
      ) : null}
      <ul className="mt-6 space-y-2">
        {candidateIds.map((id) => (
          <li key={id}>
            <Link href={`/candidates/${id}`} className="underline" data-testid="candidate-link">
              Candidate {id.slice(0, 8)}…
            </Link>
            <span className="text-[var(--qs-text-muted)]"> · </span>
            <Link href={`/candidates/${id}/verification`} className="text-sm underline">
              S12 findings
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
