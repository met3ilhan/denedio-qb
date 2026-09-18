import { describe, expect, it } from "vitest";

import {
  createGenerationProvider,
  generationProviderConfigHash,
} from "@/shared/ai/generation";
import {
  createSolverProvider,
  solverProviderConfigHash,
} from "@/shared/ai/solver";

describe("solver provider independence", () => {
  it("uses disjoint provider config from generation", () => {
    const gen = createGenerationProvider();
    const solver = createSolverProvider();
    expect(generationProviderConfigHash(gen)).not.toBe(solverProviderConfigHash(solver));
    expect(solver.solverProfile).toBe("independent");
  });
});
