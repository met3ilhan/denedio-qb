"use client";

import Link from "next/link";

import type { VerificationResult } from "@/shared/validation/verification-result";

type VerificationFindingsWorkspaceProps = {
  candidateId: string;
  verification: VerificationResult | null;
  stale: boolean;
};

const LEVEL_ORDER = ["FAIL", "WARNING", "PASS"] as const;

export function VerificationFindingsWorkspace({
  candidateId,
  verification,
  stale,
}: VerificationFindingsWorkspaceProps) {
  async function reverify() {
    await fetch(`/api/candidates/${candidateId}/verify`, { method: "POST" });
    window.location.reload();
  }

  const grouped = groupFindings(verification?.findings ?? []);

  return (
    <div data-testid="verification-findings">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-mono text-sm">
          Quality gate:{" "}
          <span data-testid="quality-gate">{verification?.quality_gate ?? "UNKNOWN"}</span>
        </p>
        {stale ? (
          <span className="text-sm text-amber-700" data-testid="verification-stale">
            Stale
          </span>
        ) : null}
        <button
          type="button"
          onClick={reverify}
          className="rounded-md border border-[var(--qs-border)] px-3 py-1 text-sm"
        >
          Re-run verification
        </button>
        <Link href={`/candidates/${candidateId}/approve`} className="text-sm underline">
          S13 Approval
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {LEVEL_ORDER.map((level) => {
          const items = grouped[level];
          if (!items?.length) return null;
          return (
            <section key={level}>
              <h3 className="text-title text-[var(--qs-text)]">{level}</h3>
              <ul className="mt-2 space-y-2">
                {items.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-md border border-[var(--qs-border)] bg-[var(--qs-surface)] p-3 text-sm"
                    data-testid={`finding-${f.level}-${f.code}`}
                  >
                    <span className="text-mono text-[var(--qs-text-muted)]">{f.group}</span>
                    <p>{f.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {verification?.fingerprint_checklist.length ? (
        <section className="mt-8">
          <h3 className="text-title text-[var(--qs-text)]">Fingerprint fidelity</h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--qs-text-muted)]">
                <th className="py-1">Dimension</th>
                <th>Verdict</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {verification.fingerprint_checklist.map((row) => (
                <tr key={row.dimensionKey} data-testid={`fp-row-${row.dimensionKey}`}>
                  <td className="py-1 font-mono">{row.dimensionKey}</td>
                  <td data-testid={`fp-verdict-${row.dimensionKey}`}>{row.verdict}</td>
                  <td>{row.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}

function groupFindings(findings: VerificationResult["findings"]) {
  const map: Record<string, VerificationResult["findings"]> = {};
  for (const f of findings) {
    map[f.level] = map[f.level] ?? [];
    map[f.level].push(f);
  }
  return map;
}
