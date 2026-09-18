import { z } from "zod";

import { fingerprintDimensionVerdict } from "./pedagogy-enums";
import { evidencePointer, nonEmptyTrimmed, schemaVersion } from "./primitives";

const studioId = z.string().min(1);

export const verifierFindingLevel = z.enum(["PASS", "WARNING", "FAIL"]);

export const verifierFindingCode = z.enum([
  "REJECT_TRIVIAL",
  "REJECT_MECHANISM",
  "REJECT_DISTRACTOR",
  "REJECT_COPY",
  "REJECT_SIBLING",
  "CHOICE_INVARIANT",
  "SOLVER_MISMATCH",
  "SOLVER_AMBIGUOUS",
  "FINGERPRINT_DRIFT",
  "FINGERPRINT_UNVERIFIED",
  "MUTATION_PLAN_MISSING",
  "CAUSALITY_INCOMPLETE",
  "SIM_STRUCTURAL_ISOMORPHISM",
  "SIM_WORD_OVERLAP",
  "SIM_EMBEDDING_NEAR_DUPLICATE",
  "SIM_SIBLING_COLLAPSE",
  "EXPORT_FIELD_MISSING",
]);

export const verifierFindingSchema = z.object({
  id: z.string(),
  code: verifierFindingCode,
  level: verifierFindingLevel,
  group: z.enum(["Solver", "Fingerprint", "Distractor", "Similarity", "Schema", "Trivial"]),
  message: z.string().max(2000),
  evidence: z.array(evidencePointer).optional(),
  dimensionKey: z.string().optional(),
  fingerprintVerdict: fingerprintDimensionVerdict.optional(),
  remediationScreen: z.enum(["S07", "S11", "S17", "S08"]).optional(),
});

export const verificationResultSchema = z
  .object({
    schemaVersion,
    verifierRunId: studioId.optional(),
    targetType: z.enum(["candidate", "question_version"]),
    targetId: studioId,
    findings: z.array(verifierFindingSchema),
    fingerprint_checklist: z.array(
      z.object({
        dimensionKey: nonEmptyTrimmed,
        verdict: fingerprintDimensionVerdict,
        level: verifierFindingLevel,
        evidence: z.array(evidencePointer).optional(),
      }),
    ),
    similarity: z
      .object({
        structural_isomorphism: z.boolean(),
        wording_overlap_ratio: z.number().min(0).max(1).optional(),
        embedding_distance: z.number().optional(),
        source_comparison_ref: studioId.optional(),
        sibling_comparison_refs: z.array(studioId).optional(),
      })
      .optional(),
    aggregate_recommendation: z.enum(["APPROVE", "REJECT", "REVISE_FINGERPRINT"]),
    quality_gate: z.enum(["GATE_PASS", "GATE_CONDITIONAL", "GATE_FAIL"]),
  })
  .strict()
  .superRefine((val, ctx) => {
    const hasFail = val.findings.some((f) => f.level === "FAIL");
    if (hasFail && val.quality_gate === "GATE_PASS") {
      ctx.addIssue({
        code: "custom",
        message: "quality_gate inconsistent with FAIL findings",
      });
    }
  });

export type VerificationResult = z.infer<typeof verificationResultSchema>;
export type VerifierFinding = z.infer<typeof verifierFindingSchema>;
