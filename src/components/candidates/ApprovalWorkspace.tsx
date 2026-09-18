"use client";

import { useState } from "react";

import type { VerificationResult } from "@/shared/validation/verification-result";

type ApprovalWorkspaceProps = {
  candidateId: string;
  verification: VerificationResult | null;
  stale: boolean;
};

export function ApprovalWorkspace({ candidateId, verification, stale }: ApprovalWorkspaceProps) {
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const blocked =
    stale || !verification || verification.quality_gate === "GATE_FAIL";

  async function approve() {
    const res = await fetch(`/api/candidates/${candidateId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklist: {
          mechanism_preserved: true,
          distractor_causality: true,
          solver_consistent: true,
        },
        comment,
      }),
    });
    const data = (await res.json()) as { error?: string; generatedQuestionId?: string };
    if (data.error) {
      setMessage(data.error);
      return;
    }
    window.location.href = `/questions/${data.generatedQuestionId}`;
  }

  async function reject() {
    await fetch(`/api/candidates/${candidateId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: comment || "Send back" }),
    });
    setMessage("Candidate rejected.");
  }

  return (
    <div data-testid="approval-workspace">
      <p className="text-body text-[var(--qs-text-muted)]">
        Gate: <span data-testid="approval-gate">{verification?.quality_gate ?? "none"}</span>
      </p>
      {blocked ? (
        <p className="mt-2 text-sm text-red-700" data-testid="approval-blocked">
          Approval blocked until verification passes and is current.
        </p>
      ) : null}
      <textarea
        className="text-body mt-4 min-h-[100px] w-full rounded-md border border-[var(--qs-border)] p-3"
        placeholder="Expert comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={blocked}
          onClick={approve}
          className="rounded-md bg-[var(--qs-phase-ship)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="approve-button"
        >
          Approve candidate
        </button>
        <button
          type="button"
          onClick={reject}
          className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
        >
          Reject
        </button>
      </div>
      {message ? <p className="text-body mt-2">{message}</p> : null}
    </div>
  );
}
