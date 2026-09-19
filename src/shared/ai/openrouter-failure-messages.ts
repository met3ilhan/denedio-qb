import { tr } from "@/shared/copy/tr";

import { formatGeminiTransportFailure } from "./gemini-failure-messages";
import {
  OpenRouterInsufficientCreditsError,
  OpenRouterRequestError,
  OpenRouterRetryExhaustedError,
} from "./openrouter/errors";

export function formatOpenRouterTransportFailure(error: unknown): {
  userMessage: string;
  technicalMessage: string;
} {
  const technicalMessage = error instanceof Error ? error.message : String(error);

  if (error instanceof OpenRouterInsufficientCreditsError) {
    return {
      userMessage: tr.aiService.openRouterInsufficientCredits,
      technicalMessage,
    };
  }

  if (error instanceof OpenRouterRetryExhaustedError) {
    return {
      userMessage: tr.aiService.unavailable,
      technicalMessage: error.lastError.message,
    };
  }

  if (error instanceof OpenRouterRequestError) {
    if (error.code === "INSUFFICIENT_CREDITS") {
      return {
        userMessage: tr.aiService.openRouterInsufficientCredits,
        technicalMessage,
      };
    }
    if (error.retryable) {
      return {
        userMessage: tr.aiService.unavailable,
        technicalMessage,
      };
    }
    if (error.code === "AUTH_ERROR") {
      return {
        userMessage: tr.aiService.authError,
        technicalMessage,
      };
    }
    if (error.code === "INVALID_REQUEST" || error.code === "STRUCTURED_OUTPUT_INVALID") {
      return {
        userMessage: tr.aiService.invalidRequestError,
        technicalMessage,
      };
    }
    if (error.code === "CONTENT_REFUSAL") {
      return {
        userMessage: tr.aiService.genericFailure,
        technicalMessage,
      };
    }
  }

  const transientHttp = /HTTP (429|500|502|503|504)\b/.test(technicalMessage);
  const network = technicalMessage.includes("network error");
  if (transientHttp || network) {
    return {
      userMessage: tr.aiService.unavailable,
      technicalMessage,
    };
  }

  return {
    userMessage: tr.aiService.genericFailure,
    technicalMessage,
  };
}

/** Maps live AI transport failures for the configured vendor (OpenRouter default). */
export function formatLiveAiTransportFailure(error: unknown): {
  userMessage: string;
  technicalMessage: string;
} {
  if (
    error instanceof OpenRouterInsufficientCreditsError ||
    error instanceof OpenRouterRequestError ||
    error instanceof OpenRouterRetryExhaustedError ||
    /OpenRouter/i.test(error instanceof Error ? error.message : String(error))
  ) {
    return formatOpenRouterTransportFailure(error);
  }
  return formatGeminiTransportFailure(error);
}
