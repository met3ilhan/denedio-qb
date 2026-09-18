import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { defaultCurriculumSelection } from "@/modules/catalog";
import { buildQuestionImportPayload } from "@/modules/export/denedio-mapper";
import { runDryRun } from "@/modules/export/dry-run";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { questionImportPayloadSchema } from "@/shared/validation/question-import-payload";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

describe("Denedio golden payload", () => {
  it("matches QuestionImportPayloadSchema and passes dry-run against catalog mirror", () => {
    const raw = readFileSync(
      join(__dirname, "fixtures", "golden-import-payload.json"),
      "utf8",
    );
    const golden = questionImportPayloadSchema.parse(JSON.parse(raw));

    const question = generatedQuestionSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      stem: { questionText: golden.items[0].content.questionText },
      choices: [
        {
          label: "A",
          text: "Wrong",
          isCorrect: false,
          trap_type_ids: ["TRAP_PARTIAL"],
        },
        { label: "B", text: "Correct", isCorrect: true },
        { label: "C", text: "Wrong 2", isCorrect: false, trap_type_ids: ["TRAP_PARTIAL"] },
        { label: "D", text: "Wrong 3", isCorrect: false, trap_type_ids: ["TRAP_PARTIAL"] },
      ],
      solution: { solutionText: golden.items[0].content.solutionText },
      metadata: { difficulty: "MEDIUM" },
      provenance: {
        sourceQuestionId: "src-1",
        fingerprintVersionId: "fp-1",
        generationRunId: "run-1",
        mutationPlanId: "plan-1",
      },
    });

    const mapped = buildQuestionImportPayload({
      question,
      curriculum: defaultCurriculumSelection(),
      importExternalKey: golden.items[0].externalKey!,
    });

    expect(mapped.items[0].examTypeId).toBe(golden.items[0].examTypeId);
    expect(mapped.items[0].content.choices[0].distractor?.trapTypeId).toBe(
      golden.items[0].content.choices[0].distractor?.trapTypeId,
    );

    const dry = runDryRun({ payload: golden, curriculum: defaultCurriculumSelection() });
    expect(dry.passed).toBe(true);
  });
});
