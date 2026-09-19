import { ZodError } from "zod";

import { formatGeminiTransportFailure } from "../gemini-failure-messages";
import { formatOpenRouterTransportFailure } from "../openrouter-failure-messages";
import { GeminiQuotaExhaustedError } from "../gemini-retry";
import {
  OpenRouterInsufficientCreditsError,
  OpenRouterRequestError,
  OpenRouterRetryExhaustedError,
} from "../openrouter/errors";
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

  if (
    error instanceof OpenRouterInsufficientCreditsError ||
    error instanceof OpenRouterRequestError ||
    error instanceof OpenRouterRetryExhaustedError
  ) {
    return formatOpenRouterTransportFailure(error);
  }

  const technicalMessage = error instanceof Error ? error.message : String(error);
  const isGeminiTransport =
    /^Gemini .+ (HTTP \d+|network error)/.test(technicalMessage) ||
    technicalMessage.includes("transient Gemini failures exhausted") ||
    technicalMessage.includes("QUOTA_EXHAUSTED");

  if (isGeminiTransport) {
    return formatGeminiTransportFailure(error);
  }

  const isOpenRouterTransport =
    /^OpenRouter .+ (HTTP \d+|network error)/.test(technicalMessage) ||
    technicalMessage.includes("transient OpenRouter failures exhausted") ||
    technicalMessage.includes("INSUFFICIENT_CREDITS");

  if (isOpenRouterTransport) {
    return formatOpenRouterTransportFailure(error);
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
