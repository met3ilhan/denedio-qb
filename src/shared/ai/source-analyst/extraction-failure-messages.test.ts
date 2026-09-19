import { describe, expect, it } from "vitest";
import { z } from "zod";

import { tr } from "@/shared/copy/tr";

import { GeminiQuotaExhaustedError, GeminiRetryExhaustedError } from "../gemini-retry";

import { formatExtractionFailure } from "./extraction-failure-messages";

describe("formatExtractionFailure", () => {
  it("maps ZodError to Turkish user message and JSON technical detail", () => {
    let zodErr: z.ZodError | undefined;
    try {
      z.object({ page: z.number() }).parse({ page: null });
    } catch (e) {
      zodErr = e as z.ZodError;
    }
    const { userMessage, technicalMessage } = formatExtractionFailure(zodErr);
    expect(userMessage).toBe(tr.extraction.schemaShapeError);
    expect(technicalMessage).toContain("fieldErrors");
  });

  it("maps exhausted Gemini transport failure to Turkish unavailable message", () => {
    const err = new GeminiRetryExhaustedError(
      "Gemini source analyst",
      new Error("Gemini source analyst HTTP 503: busy"),
    );
    const { userMessage, technicalMessage } = formatExtractionFailure(err);
    expect(userMessage).toBe(tr.aiService.unavailable);
    expect(technicalMessage).toContain("503");
  });

  it("maps quota exhaustion to Turkish quota message", () => {
    const err = new GeminiQuotaExhaustedError(
      "Gemini source analyst",
      429,
      "RESOURCE_EXHAUSTED",
    );
    const { userMessage } = formatExtractionFailure(err);
    expect(userMessage).toBe(tr.aiService.quotaExhausted);
  });
});
