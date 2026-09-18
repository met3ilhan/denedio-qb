import { describe, expect, it } from "vitest";

import {
  assertExtractionJobTransition,
  canTransitionExtractionJob,
} from "./extraction-job-state";

describe("extraction job state machine", () => {
  it("allows pending to running", () => {
    expect(canTransitionExtractionJob("PENDING", "RUNNING")).toBe(true);
  });

  it("allows running to succeeded", () => {
    expect(canTransitionExtractionJob("RUNNING", "SUCCEEDED")).toBe(true);
  });

  it("allows failed to pending on retry", () => {
    expect(canTransitionExtractionJob("FAILED", "PENDING")).toBe(true);
  });

  it("blocks succeeded to running", () => {
    expect(canTransitionExtractionJob("SUCCEEDED", "RUNNING")).toBe(false);
  });

  it("assert throws on invalid transition", () => {
    expect(() => assertExtractionJobTransition("SUCCEEDED", "FAILED")).toThrow();
  });
});
