import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import type { VerificationResult } from "@/shared/validation/verification-result";

export type ComparisonCellStatus = "pass" | "warn" | "fail" | "na";

export type ComparisonCell = {
  candidateId: string;
  siblingIndex: number;
  status: ComparisonCellStatus;
  detail: string;
};

export type ComparisonRow = {
  rowKey: string;
  label: string;
  cells: ComparisonCell[];
};

export type SiblingComparisonInput = {
  id: string;
  siblingIndex: number;
  draft: GeneratedQuestion;
  distractorAnalysis: DistractorAnalysis | null;
  verification: VerificationResult | null;
  plan: MutationPlan;
};

export function buildSiblingComparisonMatrix(siblings: SiblingComparisonInput[]): ComparisonRow[] {
  const mechanism = {
    rowKey: "mechanism",
    label: "Mechanism (invariants)",
    cells: siblings.map((s) => mechanismCell(s)),
  };
  const stemSim = {
    rowKey: "stem_sim",
    label: "Stem surface delta",
    cells: siblings.map((s) => stemSimilarityCell(s)),
  };
  const distractor = {
    rowKey: "distractor",
    label: "Distractor causality",
    cells: siblings.map((s) => distractorCell(s)),
  };
  const fingerprint = {
    rowKey: "fingerprint",
    label: "Fingerprint fidelity",
    cells: siblings.map((s) => fingerprintCell(s)),
  };
  return [mechanism, stemSim, distractor, fingerprint];
}

function mechanismCell(s: SiblingComparisonInput): ComparisonCell {
  const count = s.plan.invariant_assertions.length;
  const regen = s.plan.distractor_regeneration.length;
  if (count >= 6 && regen >= 3) {
    return cell(s, "pass", `${count} invariants · ${regen} distractor slots`);
  }
  if (count >= 4) {
    return cell(s, "warn", `${count} invariants — review plan depth`);
  }
  return cell(s, "fail", "Thin mutation plan");
}

function stemSimilarityCell(s: SiblingComparisonInput): ComparisonCell {
  const mutations = s.plan.surface_mutations.length;
  if (mutations >= 2) return cell(s, "pass", `${mutations} surface mutations`);
  if (mutations === 1) return cell(s, "warn", "Single surface mutation");
  return cell(s, "fail", "No surface mutation declared");
}

function distractorCell(s: SiblingComparisonInput): ComparisonCell {
  if (!s.distractorAnalysis) return cell(s, "na", "No analysis");
  const weak = s.distractorAnalysis.wrong_choices.some((w) => !w.mechanism_id);
  if (weak) return cell(s, "warn", "Missing MECH on some choices");
  const gate = s.verification?.findings.some(
    (f) => f.group === "Distractor" && f.level === "FAIL",
  );
  if (gate) return cell(s, "fail", "Verifier distractor FAIL");
  return cell(s, "pass", `${s.distractorAnalysis.wrong_choices.length} causal paths`);
}

function fingerprintCell(s: SiblingComparisonInput): ComparisonCell {
  if (!s.verification) return cell(s, "na", "Not verified");
  const gate = s.verification.quality_gate;
  if (gate === "GATE_FAIL") return cell(s, "fail", "GATE_FAIL");
  if (gate === "GATE_CONDITIONAL") return cell(s, "warn", "GATE_CONDITIONAL");
  return cell(s, "pass", gate);
}

function cell(
  s: SiblingComparisonInput,
  status: ComparisonCellStatus,
  detail: string,
): ComparisonCell {
  return { candidateId: s.id, siblingIndex: s.siblingIndex, status, detail };
}
