import type { GeneratedQuestionStatus } from "@prisma/client";

export type ExportEligibilityInput = {
  questionStatus: GeneratedQuestionStatus;
  candidateStatus: string | null;
  latestVersionVerificationState: string;
  hasExplicitDenedioMapping: boolean;
  verificationStaleAt: Date | null;
};

export type ExportBlockReason =
  | "NOT_APPROVED"
  | "CANDIDATE_REJECTED"
  | "VERIFICATION_STALE"
  | "VERSION_NEEDS_REVERIFY"
  | "MISSING_DENEDIO_MAPPING";

export function assessExportEligibility(input: ExportEligibilityInput): {
  eligible: boolean;
  reasons: ExportBlockReason[];
} {
  const reasons: ExportBlockReason[] = [];

  if (input.questionStatus !== "APPROVED") {
    reasons.push("NOT_APPROVED");
  }
  if (input.candidateStatus === "REJECTED") {
    reasons.push("CANDIDATE_REJECTED");
  }
  if (input.verificationStaleAt) {
    reasons.push("VERIFICATION_STALE");
  }
  if (input.latestVersionVerificationState !== "VERIFIED") {
    reasons.push("VERSION_NEEDS_REVERIFY");
  }
  if (!input.hasExplicitDenedioMapping) {
    reasons.push("MISSING_DENEDIO_MAPPING");
  }

  return { eligible: reasons.length === 0, reasons };
}
