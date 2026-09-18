import { ZodError } from "zod";

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

  const technicalMessage = error instanceof Error ? error.message : String(error);
  const isProviderHttp = technicalMessage.includes("Gemini source analyst HTTP");
  const isNetwork = technicalMessage.includes("network error");

  if (isProviderHttp || isNetwork) {
    return {
      userMessage: tr.extraction.providerUnavailableError,
      technicalMessage,
    };
  }

  if (technicalMessage.includes("page is not a positive integer")) {
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
