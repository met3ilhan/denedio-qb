import type { MutationPlan } from "@/shared/validation/mutation-plan";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import { CORE_INVARIANT_ASSERTION_DIMENSIONS } from "@/shared/validation/pedagogical-fingerprint";
import type { FingerprintDimensionVerdict } from "@/shared/validation/pedagogy-enums";
import type { z } from "zod";

import { evidencePointer } from "@/shared/validation/primitives";

type EvidencePointer = z.infer<typeof evidencePointer>;

export type FingerprintChecklistRow = {
  dimensionKey: string;
  verdict: FingerprintDimensionVerdict;
  level: "PASS" | "WARNING" | "FAIL";
  evidence: EvidencePointer[];
  expected?: string;
  observed?: string;
};

export type InvariantAssertionEvaluation = {
  dimension: string;
  expected: string;
  observed: string;
  status: "PRESERVED" | "DRIFTED" | "UNKNOWN" | "NOT_APPLICABLE";
  evidence: EvidencePointer[];
};

/** Missing dimension_evidence must never synthesize PRESERVED. */
export function buildFingerprintChecklistRows(
  fingerprint: PedagogicalFingerprint,
): FingerprintChecklistRow[] {
  const evidenceByKey = new Map(
    (fingerprint.dimension_evidence ?? []).map((row) => [row.dimensionKey, row]),
  );

  return CORE_INVARIANT_ASSERTION_DIMENSIONS.map((dimensionKey) => {
    const row = evidenceByKey.get(dimensionKey);
    if (!row) {
      return {
        dimensionKey,
        verdict: "UNVERIFIED",
        level: "WARNING",
        evidence: [],
        expected: `Locked fingerprint documents ${dimensionKey}`,
        observed: "No dimension_evidence row at lock time",
      };
    }

    const verdict = row.verdict ?? "UNVERIFIED";
    const hasEvidence = (row.evidence?.length ?? 0) > 0;
    let level: FingerprintChecklistRow["level"] = "PASS";

    if (verdict === "DRIFT") {
      level = "FAIL";
    } else if (verdict === "UNVERIFIED" || (verdict === "PRESERVED" && !hasEvidence)) {
      level = "WARNING";
    } else if (verdict === "PRESERVED" || verdict === "NOT_APPLICABLE") {
      level = "PASS";
    }

    const effectiveVerdict =
      verdict === "PRESERVED" && !hasEvidence ? "UNVERIFIED" : verdict;

    return {
      dimensionKey,
      verdict: effectiveVerdict,
      level,
      evidence: row.evidence ?? [],
      expected: row.rationale ?? `Invariant ${dimensionKey} per locked fingerprint`,
      observed: hasEvidence
        ? `${row.evidence.length} evidence pointer(s)`
        : "No supporting evidence pointers",
    };
  });
}

export function evaluatePlanInvariantAssertions(
  plan: MutationPlan,
  questionStem: string,
): InvariantAssertionEvaluation[] {
  return plan.invariant_assertions.map((assertion) => {
    const expected = assertion.expected ?? assertion.assertion;
    const stemLower = questionStem.toLowerCase();

    if (assertion.dimension === "solution_skeleton") {
      const expectsRoundTrip =
        expected.toLowerCase().includes("round") ||
        expected.toLowerCase().includes("two leg") ||
        expected.toLowerCase().includes("dual");
      const hasRoundTrip =
        stemLower.includes("round trip") ||
        stemLower.includes("returns") ||
        stemLower.includes("and back");
      const hasOneWayOnly =
        stemLower.includes("one way") ||
        stemLower.includes("one-way") ||
        (stemLower.includes("crossing") && !hasRoundTrip && !stemLower.includes("return"));

      if (expectsRoundTrip && hasOneWayOnly) {
        return {
          dimension: assertion.dimension,
          expected,
          observed: "Stem collapsed to one-way crossing",
          status: "DRIFTED",
          evidence: [{ excerpt: questionStem.slice(0, 240) }],
        };
      }
      if (expectsRoundTrip && hasRoundTrip) {
        return {
          dimension: assertion.dimension,
          expected,
          observed: "Round-trip structure present in stem",
          status: "PRESERVED",
          evidence: [{ excerpt: "round trip / return leg cues detected" }],
        };
      }
    }

    if (assertion.dimension === "measured_skill") {
      const driftedSkill =
        stemLower.includes("arithmetic mean") ||
        stemLower.includes("average speed for round trips");
      if (driftedSkill) {
        return {
          dimension: assertion.dimension,
          expected,
          observed: "Stem encodes mean-speed shortcut — skill drift",
          status: "DRIFTED",
          evidence: [{ excerpt: questionStem.slice(0, 200) }],
        };
      }
    }

    if (assertion.dimension === "distractor_mechanisms") {
      if (expected.toLowerCase().includes("replayable") || expected.toLowerCase().includes("mech_")) {
        return {
          dimension: assertion.dimension,
          expected,
          observed: "Deferred to distractor causality engine",
          status: "UNKNOWN",
          evidence: [],
        };
      }
    }

    return {
      dimension: assertion.dimension,
      expected,
      observed: "No automated structural check for this dimension",
      status: "UNKNOWN",
      evidence: [],
    };
  });
}

export function overallFingerprintFidelityLevel(
  rows: FingerprintChecklistRow[],
): "PASS" | "WARNING" | "FAIL" {
  if (rows.some((r) => r.level === "FAIL")) return "FAIL";
  if (rows.some((r) => r.level === "WARNING")) return "WARNING";
  return "PASS";
}
