import { describe, expect, it } from "vitest";
import { z } from "zod";

import { tr } from "@/shared/copy/tr";

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
});
