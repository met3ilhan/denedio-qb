import { ZodError } from "zod";

import { formatGeminiTransportFailure } from "../gemini-failure-messages";
import { GeminiQuotaExhaustedError } from "../gemini-retry";
import { tr } from "@/shared/copy/tr";

export function formatExtractionFailure(error: unknown): {
  userMessage: string;
  technicalMessage: string;
} {
  if (error instanceof ZodError) {
    return {
      userMessage: tr.extraction.schemaShapeError,
      technicalMessage: JSON.stringify(error.flatten(), null, 2),
    };
  }

  if (error instanceof GeminiQuotaExhaustedError) {
    return formatGeminiTransportFailure(error);
  }

  const technicalMessage = error instanceof Error ? error.message : String(error);
  const isGeminiTransport =
    /^Gemini .+ (HTTP \d+|network error)/.test(technicalMessage) ||
    technicalMessage.includes("transient Gemini failures exhausted") ||
    technicalMessage.includes("QUOTA_EXHAUSTED");

  if (isGeminiTransport) {
    return formatGeminiTransportFailure(error);
  }

  if (technicalMessage.includes("page is not a positive integer")) {
    return {
      userMessage: tr.extraction.schemaShapeError,
      technicalMessage,
    };
  }

  if (
    technicalMessage.includes("returned invalid JSON") ||
    technicalMessage.includes("did not contain JSON object")
  ) {
    return {
      userMessage: tr.extraction.schemaShapeError,
      technicalMessage,
    };
  }

  return {
    userMessage: tr.extraction.genericFailureError,
    technicalMessage,
  };
}
