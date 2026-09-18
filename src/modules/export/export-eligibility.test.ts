import { describe, expect, it } from "vitest";

import { assessExportEligibility } from "@/modules/export/export-eligibility";

describe("assessExportEligibility", () => {
  const ok = {
    questionStatus: "APPROVED" as const,
    candidateStatus: "APPROVED",
    latestVersionVerificationState: "VERIFIED",
    hasExplicitDenedioMapping: true,
    verificationStaleAt: null,
  };

  it("allows eligible approved verified question", () => {
    expect(assessExportEligibility(ok).eligible).toBe(true);
  });

  it("blocks rejected candidate", () => {
    const r = assessExportEligibility({ ...ok, candidateStatus: "REJECTED" });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("CANDIDATE_REJECTED");
  });

  it("blocks stale verification", () => {
    const r = assessExportEligibility({ ...ok, verificationStaleAt: new Date() });
    expect(r.reasons).toContain("VERIFICATION_STALE");
  });

  it("blocks missing mapping", () => {
    const r = assessExportEligibility({ ...ok, hasExplicitDenedioMapping: false });
    expect(r.reasons).toContain("MISSING_DENEDIO_MAPPING");
  });

  it("blocks version needing reverify", () => {
    const r = assessExportEligibility({
      ...ok,
      latestVersionVerificationState: "NEEDS_REVERIFY",
    });
    expect(r.reasons).toContain("VERSION_NEEDS_REVERIFY");
  });
});
