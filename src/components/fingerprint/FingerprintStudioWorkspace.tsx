"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EvidenceSpan } from "@/components/fingerprint/EvidenceSpan";
import { INVARIANT_FIELD_KEYS } from "@/shared/validation/pedagogical-fingerprint";

type FingerprintStudioWorkspaceProps = {
  versionId: string;
  versionNumber: number;
  status: "DRAFT" | "LOCKED";
  payload: Record<string, unknown>;
  evidence: Array<{
    id: string;
    dimensionKey: string;
    excerpt: string;
    evidenceType: string;
  }>;
  dimensionGroups: Array<{ group: string; keys: string[] }>;
};

function formatFieldValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return "—";
}

export function FingerprintStudioWorkspace({
  versionId,
  versionNumber,
  status,
  payload,
  evidence,
  dimensionGroups,
}: FingerprintStudioWorkspaceProps) {
  const router = useRouter();
  const flatKeys = dimensionGroups.flatMap((g) => g.keys);
  const [activeKey, setActiveKey] = useState(flatKeys[0] ?? "measured_skill");
  const [mutableNotes, setMutableNotes] = useState(
    String(payload.mutable_surface_notes ?? ""),
  );
  const [lockWarnings, setLockWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isInvariant = INVARIANT_FIELD_KEYS.has(activeKey);
  const activeEvidence = evidence.filter((e) => e.dimensionKey === activeKey);

  async function saveMutable() {
    setBusy(true);
    try {
      await fetch(`/api/fingerprint/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutable_surface_notes: mutableNotes }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function lockFingerprint() {
    setBusy(true);
    try {
      const res = await fetch(`/api/fingerprint/${versionId}/lock`, { method: "POST" });
      const data = (await res.json()) as { warnings?: Array<{ message: string }> };
      setLockWarnings(data.warnings?.map((w) => w.message) ?? []);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.25fr)_minmax(0,0.45fr)_minmax(0,0.3fr)]"
      data-testid="fingerprint-studio"
    >
      <nav className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <p className="font-mono text-xs text-[var(--qs-text-muted)]">
          v{versionNumber} · {status}
        </p>
        {dimensionGroups.map((group) => (
          <div key={group.group} className="mt-4">
            <p className="font-mono text-[10px] uppercase text-[var(--qs-text-muted)]">
              {group.group}
            </p>
            <ul className="mt-2 space-y-1">
              {group.keys.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActiveKey(key)}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                      activeKey === key
                        ? "bg-[var(--qs-phase-mechanism-50)] font-medium text-[var(--qs-text)]"
                        : "text-[var(--qs-text-muted)] hover:bg-[var(--qs-canvas)]"
                    }`}
                  >
                    {key.replace(/_/g, " ")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <section className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-title capitalize text-[var(--qs-text)]">
            {activeKey.replace(/_/g, " ")}
          </h2>
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${
              isInvariant
                ? "bg-[var(--qs-invariant-bg)] text-[var(--qs-text)]"
                : "bg-[var(--qs-mutable-bg)] text-[var(--qs-text)]"
            }`}
          >
            {isInvariant ? "Invariant" : "Mutable"}
          </span>
        </div>
        {activeKey === "mutable_surface_notes" && status === "DRAFT" ? (
          <div className="mt-4 space-y-3">
            <textarea
              className="text-body min-h-[120px] w-full rounded-md border border-[var(--qs-border)] p-3"
              value={mutableNotes}
              onChange={(e) => setMutableNotes(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={saveMutable}
              className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
            >
              Save mutable notes
            </button>
          </div>
        ) : (
          <pre className="text-mono mt-4 max-h-[420px] overflow-auto rounded-md border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-3 text-[var(--qs-text)]">
            {formatFieldValue(payload[activeKey])}
          </pre>
        )}
        {status === "DRAFT" ? (
          <button
            type="button"
            disabled={busy}
            onClick={lockFingerprint}
            className="mt-4 rounded-md bg-[var(--qs-phase-mechanism)] px-3 py-2 text-sm font-medium text-white"
            data-testid="lock-fingerprint"
          >
            Lock fingerprint version
          </button>
        ) : null}
        {lockWarnings.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-[var(--qs-severity-minor)]" data-testid="lock-warnings">
            {lockWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <aside className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Evidence</h2>
        <div className="mt-4 space-y-2">
          {activeEvidence.length === 0 ? (
            <p className="text-sm text-[var(--qs-text-muted)]">No evidence rows for this dimension.</p>
          ) : (
            activeEvidence.map((row) => (
              <EvidenceSpan
                key={row.id}
                dimensionKey={`${row.dimensionKey} · ${row.evidenceType}`}
                excerpt={row.excerpt}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
