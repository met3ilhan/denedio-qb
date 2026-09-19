import { tr } from "@/shared/copy/tr";

import { GeminiRequestError, GeminiRetryExhaustedError } from "./gemini-retry";

export function formatGeminiTransportFailure(error: unknown): {
  userMessage: string;
  technicalMessage: string;
} {
  const technicalMessage = error instanceof Error ? error.message : String(error);

  if (error instanceof GeminiRetryExhaustedError) {
    return {
      userMessage: tr.aiService.unavailable,
      technicalMessage: error.lastError.message,
    };
  }

  if (error instanceof GeminiRequestError) {
    if (error.retryable) {
      return {
        userMessage: tr.aiService.unavailable,
        technicalMessage,
      };
    }
    if (error.httpStatus === 401 || error.httpStatus === 403) {
      return {
        userMessage: tr.aiService.authError,
        technicalMessage,
      };
    }
    if (error.httpStatus === 400) {
      return {
        userMessage: tr.aiService.invalidRequestError,
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
