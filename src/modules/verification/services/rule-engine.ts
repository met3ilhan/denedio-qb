import { createHash } from "node:crypto";

import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import { correctChoiceLabel, type GeneratedQuestion } from "@/shared/validation/generated-question";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import {
  getSimilarityThresholds,
  stripNumeralsSkeleton,
  wordingOverlapRatio,
} from "@/shared/validation/similarity-config";
import type { SolverResult } from "@/shared/validation/solver-result";
import { previewTrivialMutationFlags } from "@/shared/validation/trivial-mutation";
import type { VerificationResult, VerifierFinding } from "@/shared/validation/verification-result";
import { verificationResultSchema } from "@/shared/validation/verification-result";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { verifyDistractorCausality } from "./distractor-causality";
import {
  buildFingerprintChecklistRows,
  evaluatePlanInvariantAssertions,
  overallFingerprintFidelityLevel,
} from "./fingerprint-fidelity";

export type VerificationInput = {
  candidateId: string;
  question: GeneratedQuestion;
  plan: MutationPlan;
  fingerprint: PedagogicalFingerprint;
  distractor: DistractorAnalysis | null;
  solver: SolverResult | null;
  sourceStem?: string;
  siblingPlans?: MutationPlan[];
  verifierRunId?: string;
};

export function runVerificationEngine(input: VerificationInput): VerificationResult {
  const findings: VerifierFinding[] = [];
  const thresholds = getSimilarityThresholds();

  if (!input.plan) {
    findings.push(finding("MUTATION_PLAN_MISSING", "FAIL", "Schema", "Mutation plan missing"));
  }

  const trivialFlags = previewTrivialMutationFlags(input.plan, {
    sourceStem: input.sourceStem,
    siblingPlans: input.siblingPlans,
  });
  for (const flag of trivialFlags) {
    const level = flag.code === "T4" ? "FAIL" : "WARNING";
    findings.push(
      finding(`REJECT_TRIVIAL`, level, "Trivial", `${flag.code}: ${flag.message}`, {
        remediationScreen: "S08",
      }),
    );
  }

  if (
    input.plan.surface_mutations.length < thresholds.minSurfaceMutationDimensions &&
    input.plan.surface_mutations.every((m) => m.dimension === "numbers")
  ) {
    findings.push(
      finding(
        "SIM_STRUCTURAL_ISOMORPHISM",
        "FAIL",
        "Similarity",
        "T1: numbers-only surface mutation — structural isomorphism risk.",
        { remediationScreen: "S08" },
      ),
    );
  }

  if (input.sourceStem) {
    const overlap = wordingOverlapRatio(input.sourceStem, input.question.stem.questionText);
    if (overlap > thresholds.maxWordingOverlap) {
      findings.push(
        finding(
          "SIM_WORD_OVERLAP",
          "WARNING",
          "Similarity",
          `Wording overlap ${(overlap * 100).toFixed(0)}% exceeds W1 threshold.`,
        ),
      );
    }
    const skSource = stripNumeralsSkeleton(input.sourceStem);
    const skGen = stripNumeralsSkeleton(input.question.stem.questionText);
    if (skSource === skGen && skSource.length > 20) {
      findings.push(
        finding(
          "SIM_STRUCTURAL_ISOMORPHISM",
          "FAIL",
          "Similarity",
          "Stem skeleton matches source after numeral strip (T1).",
          { remediationScreen: "S08" },
        ),
      );
    }
  }

  if (input.siblingPlans?.length) {
    const sig = planSignature(input.plan);
    const collisions = input.siblingPlans.filter((p) => planSignature(p) === sig);
    if (collisions.length > thresholds.maxSiblingSignatureCollisions) {
      findings.push(
        finding(
          "SIM_SIBLING_COLLAPSE",
          "FAIL",
          "Similarity",
          "T6: sibling mutation signature collision in run.",
          { remediationScreen: "S08" },
        ),
      );
    }
  }

  const invariantEvals = evaluatePlanInvariantAssertions(
    input.plan,
    input.question.stem.questionText,
  );
  for (const inv of invariantEvals) {
    if (inv.status === "DRIFTED") {
      findings.push(
        finding(
          "REJECT_MECHANISM",
          "FAIL",
          "Fingerprint",
          `Invariant ${inv.dimension} drifted: ${inv.observed}`,
          { dimensionKey: inv.dimension, remediationScreen: "S07" },
        ),
      );
    } else if (inv.status === "UNKNOWN") {
      findings.push(
        finding(
          "FINGERPRINT_UNVERIFIED",
          "WARNING",
          "Fingerprint",
          `Invariant ${inv.dimension} — evidence insufficient (${inv.observed}).`,
          { dimensionKey: inv.dimension, remediationScreen: "S07" },
        ),
      );
    }
  }

  if (!input.distractor) {
    findings.push(
      finding("CAUSALITY_INCOMPLETE", "FAIL", "Distractor", "Distractor analysis missing.", {
        remediationScreen: "S11",
      }),
    );
  } else {
    const wrongLabels = input.question.choices.filter((c) => !c.isCorrect).map((c) => c.label);
    for (const label of wrongLabels) {
      const entry = input.distractor.wrong_choices.find((w) => w.choice_label === label);
      if (!entry) {
        findings.push(
          finding(
            "CAUSALITY_INCOMPLETE",
            "FAIL",
            "Distractor",
            `Wrong choice ${label} lacks causality metadata.`,
            { remediationScreen: "S11" },
          ),
        );
      }
    }

    const causality = verifyDistractorCausality(input.question, input.distractor);
    for (const row of causality) {
      if (row.state === "CONTRADICTED") {
        findings.push(
          finding(
            "REJECT_DISTRACTOR",
            "FAIL",
            "Distractor",
            `Choice ${row.choice_label}: ${row.message}`,
            { remediationScreen: "S11" },
          ),
        );
      } else if (row.state === "UNVERIFIED") {
        const level =
          /decorative|T4|no replayable/i.test(row.message) ? "FAIL" : "WARNING";
        findings.push(
          finding(
            "REJECT_DISTRACTOR",
            level,
            "Distractor",
            `Choice ${row.choice_label}: ${row.message}`,
            { remediationScreen: "S11" },
          ),
        );
      }
    }

    const decorative = input.distractor.decorative_distractor_flags?.length ?? 0;
    if (decorative > 0) {
      findings.push(
        finding(
          "REJECT_DISTRACTOR",
          "FAIL",
          "Distractor",
          "Decorative distractor flagged in analysis.",
          { remediationScreen: "S11" },
        ),
      );
    }
  }

  const expected = correctChoiceLabel(input.question);
  let solutionSupported = false;

  if (input.solver) {
    if (!input.solver.is_unique || input.solver.selected_label === null) {
      findings.push(
        finding("SOLVER_AMBIGUOUS", "FAIL", "Solver", "Solver reported ambiguity.", {
          remediationScreen: "S11",
        }),
      );
    } else if (input.solver.selected_label !== expected) {
      findings.push(
        finding(
          "SOLVER_MISMATCH",
          "FAIL",
          "Solver",
          `Solver selected ${input.solver.selected_label}; keyed correct is ${expected}.`,
          { remediationScreen: "S11" },
        ),
      );
    } else {
      solutionSupported = solverReasoningSupportsAnswer(input.solver, expected);
      if (!solutionSupported) {
        findings.push(
          finding(
            "SOLVER_MISMATCH",
            "FAIL",
            "Solver",
            `Answer label matches ${expected} but reasoning trace does not support the selection.`,
            { remediationScreen: "S11" },
          ),
        );
      } else {
        findings.push(
          finding("SOLVER_MISMATCH", "PASS", "Solver", "Solver agrees with keyed correct answer."),
        );
      }
    }
  } else {
    findings.push(
      finding("SOLVER_AMBIGUOUS", "FAIL", "Solver", "Solver run missing.", {
        remediationScreen: "S11",
      }),
    );
  }

  const checklistRows = buildFingerprintChecklistRows(input.fingerprint);
  const fidelityOverall = overallFingerprintFidelityLevel(checklistRows);

  for (const row of checklistRows) {
    if (row.verdict === "DRIFT") {
      findings.push(
        finding(
          "FINGERPRINT_DRIFT",
          "FAIL",
          "Fingerprint",
          `Dimension ${row.dimensionKey} drifted from locked fingerprint.`,
          { dimensionKey: row.dimensionKey, fingerprintVerdict: row.verdict, remediationScreen: "S07" },
        ),
      );
    }
    if (row.verdict === "UNVERIFIED") {
      findings.push(
        finding(
          "FINGERPRINT_UNVERIFIED",
          "WARNING",
          "Fingerprint",
          `Dimension ${row.dimensionKey} unverified — missing or weak evidence.`,
          { dimensionKey: row.dimensionKey, fingerprintVerdict: row.verdict, remediationScreen: "S07" },
        ),
      );
    }
  }

  if (fidelityOverall === "FAIL") {
    findings.push(
      finding(
        "FINGERPRINT_DRIFT",
        "FAIL",
        "Fingerprint",
        "Fingerprint fidelity bundle failed — one or more dimensions drifted.",
        { remediationScreen: "S07" },
      ),
    );
  }

  const fingerprint_checklist = checklistRows.map((row) => ({
    dimensionKey: row.dimensionKey,
    verdict: row.verdict,
    level: row.level,
    evidence: row.evidence,
  }));

  const hasFail = findings.some((f) => f.level === "FAIL");
  const hasWarning = findings.some((f) => f.level === "WARNING");
  const quality_gate = hasFail ? "GATE_FAIL" : hasWarning ? "GATE_CONDITIONAL" : "GATE_PASS";
  const aggregate_recommendation = hasFail ? "REJECT" : hasWarning ? "APPROVE" : "APPROVE";

  return verificationResultSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    verifierRunId: input.verifierRunId,
    targetType: "candidate",
    targetId: input.candidateId,
    findings,
    fingerprint_checklist,
    similarity: {
      structural_isomorphism: findings.some((f) => f.code === "SIM_STRUCTURAL_ISOMORPHISM" && f.level === "FAIL"),
      wording_overlap_ratio: input.sourceStem
        ? wordingOverlapRatio(input.sourceStem, input.question.stem.questionText)
        : undefined,
    },
    aggregate_recommendation,
    quality_gate,
  });
}

function solverReasoningSupportsAnswer(solver: SolverResult, expectedLabel: string): boolean {
  const trace = solver.reasoning_trace.map((t) => t.description.toLowerCase()).join(" ");
  if (trace.includes(`select choice ${expectedLabel.toLowerCase()}`)) return true;
  if (trace.includes(`select ${expectedLabel.toLowerCase()}`)) return true;
  if (trace.includes(`choice ${expectedLabel.toLowerCase()}`) && trace.includes("select")) return true;
  return solver.confidence_band === "high" && solver.is_unique;
}

function finding(
  code: VerifierFinding["code"],
  level: VerifierFinding["level"],
  group: VerifierFinding["group"],
  message: string,
  extra?: Partial<VerifierFinding>,
): VerifierFinding {
  const id = createHash("sha256").update(`${code}:${message}`).digest("hex").slice(0, 12);
  return {
    id,
    code,
    level,
    group,
    message,
    ...extra,
  };
}

function planSignature(plan: MutationPlan): string {
  return [
    plan.surface_mutations.map((m) => m.dimension).sort().join(","),
    plan.distractor_regeneration.map((d) => d.choice_slot).join(","),
  ].join("|");
}
