import { describe, expect, it } from "vitest";

import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { MockSolverProvider } from "./mock-provider";
import { solveFromStemOnly } from "./stem-solver";
import { toSolverInput } from "./types";

describe("solver input firewall", () => {
  it("toSolverInput exposes only stem and choices", () => {
    const question = generatedQuestionSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      stem: { questionText: "Sample stem" },
      choices: [
        { label: "A", text: "1", isCorrect: false },
        { label: "B", text: "2", isCorrect: true },
      ],
      solution: { solutionText: "Writer secret — must not leak" },
      provenance: {
        sourceQuestionId: "s",
        fingerprintVersionId: "f",
        generationRunId: "r",
        mutationPlanId: "p",
      },
    });

    const input = toSolverInput(question);
    expect(Object.keys(input).sort()).toEqual(["choices", "stemText"]);
    expect(JSON.stringify(input)).not.toContain("Writer secret");
    expect(JSON.stringify(input)).not.toContain("writerIntendedAnswer");
  });
});

describe("mock solver independence", () => {
  it("derives ferry round-trip answer without preferring label B", async () => {
    const stem =
      "A ferry crosses 24 km and returns; still water 12 km/h, current 4 km/h parallel. Round trip minutes?";
    const input = {
      stemText: stem,
      choices: [
        { label: "A", text: "240 minutes" },
        { label: "B", text: "180 minutes" },
        { label: "C", text: "270 minutes" },
        { label: "D", text: "360 minutes" },
      ],
    };

    const solved = solveFromStemOnly(input);
    expect(solved.selected_label).toBe("C");
    expect(solved.is_unique).toBe(true);

    const provider = new MockSolverProvider();
    const { output } = await provider.solve(input);
    expect(output.selected_label).toBe("C");
  });

  it("solves demo kayak tiered rental stem uniquely", () => {
    const stem =
      "A kayak rental shop charges 12 coins for the first hour and 8 coins for each additional hour. " +
      "Variant (abc). Mira rents a kayak for 5 hours. How many coins does she pay?";
    const solved = solveFromStemOnly({
      stemText: stem,
      choices: [
        { label: "A", text: "40 coins" },
        { label: "B", text: "44 coins" },
        { label: "C", text: "36 coins" },
        { label: "D", text: "52 coins" },
      ],
    });
    expect(solved.is_unique).toBe(true);
    expect(solved.selected_label).toBe("B");
  });

  it("reports ambiguity when model cannot match choices", () => {
    const input = {
      stemText: "Explain the author's tone in paragraph three.",
      choices: [
        { label: "A", text: "Ironic" },
        { label: "B", text: "Neutral" },
      ],
    };
    const solved = solveFromStemOnly(input);
    expect(solved.is_unique).toBe(false);
    expect(solved.selected_label).toBeNull();
  });
});
