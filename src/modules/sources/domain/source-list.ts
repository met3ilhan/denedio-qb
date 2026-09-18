import type { ExtractionJobStatus, FingerprintPipelineState } from "@prisma/client";

export type ExtractionListState =
  | "none"
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

export function mapJobStatusToListState(status?: ExtractionJobStatus | null): ExtractionListState {
  if (!status) {
    return "none";
  }
  switch (status) {
    case "PENDING":
      return "queued";
    case "RUNNING":
      return "running";
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
      return "failed";
    default:
      return "none";
  }
}

export type SourceRowHrefInput = {
  extractionState: ExtractionListState;
  fingerprintState: FingerprintPipelineState;
  hasAcceptedReview: boolean;
};

export function resolveSourceRowHref(sourceFileId: string, input: SourceRowHrefInput): string {
  if (
    input.fingerprintState === "DRAFT" ||
    input.fingerprintState === "LOCKED" ||
    (input.extractionState === "succeeded" && input.hasAcceptedReview)
  ) {
    return `/sources/${sourceFileId}/fingerprint/draft`;
  }
  if (input.extractionState === "succeeded") {
    return `/sources/${sourceFileId}/review`;
  }
  return `/sources/${sourceFileId}/extraction`;
}
