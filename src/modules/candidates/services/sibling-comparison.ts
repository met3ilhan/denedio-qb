import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import type { VerificationResult } from "@/shared/validation/verification-result";
import type { FingerprintDimensionVerdict } from "@/shared/validation/pedagogy-enums";

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
  category: "mechanism" | "fingerprint" | "quality" | "status";
};

export type SiblingComparisonInput = {
  id: string;
  siblingIndex: number;
  pipelineStatus: string;
  draft: GeneratedQuestion;
  distractorAnalysis: DistractorAnalysis | null;
  verification: VerificationResult | null;
  plan: MutationPlan;
};

const FINGERPRINT_DIMENSION_ROWS: { key: string; label: string }[] = [
  { key: "measured_skill", label: "Primary measured skill" },
  { key: "reasoning_pattern", label: "Reasoning pattern" },
  { key: "critical_signal", label: "Critical signal" },
  { key: "hidden_constraint", label: "Hidden constraint" },
  { key: "solution_skeleton", label: "Reasoning step structure" },
  { key: "distractor_mechanisms", label: "Distractor architecture" },
];

export function buildSiblingComparisonMatrix(siblings: SiblingComparisonInput[]): ComparisonRow[] {
  const mechanism = {
    rowKey: "mechanism",
    label: "Mechanism (invariants)",
    category: "mechanism" as const,
    cells: siblings.map((s) => mechanismCell(s)),
  };
  const stemSim = {
    rowKey: "stem_sim",
    label: "Stem surface delta",
    category: "mechanism" as const,
    cells: siblings.map((s) => stemSimilarityCell(s)),
  };
  const distractor = {
    rowKey: "distractor",
    label: "Distractor causality",
    category: "quality" as const,
    cells: siblings.map((s) => distractorCell(s)),
  };
  const fingerprintRows = FINGERPRINT_DIMENSION_ROWS.map(({ key, label }) => ({
    rowKey: `fp_${key}`,
    label,
    category: "fingerprint" as const,
    cells: siblings.map((s) => fingerprintDimensionCell(s, key)),
  }));
  const solver = {
    rowKey: "solver",
    label: "Solver status",
    category: "quality" as const,
    cells: siblings.map((s) => solverCell(s)),
  };
  const verifier = {
    rowKey: "verifier",
    label: "Verifier status",
    category: "quality" as const,
    cells: siblings.map((s) => verifierCell(s)),
  };
  const originality = {
    rowKey: "originality",
    label: "Originality / similarity",
    category: "quality" as const,
    cells: siblings.map((s) => originalityCell(s)),
  };
  const approval = {
    rowKey: "approval",
    label: "Pipeline / approval",
    category: "status" as const,
    cells: siblings.map((s) => approvalCell(s)),
  };
  const fingerprintGate = {
    rowKey: "fingerprint",
    label: "Fingerprint fidelity (gate)",
    category: "fingerprint" as const,
    cells: siblings.map((s) => fingerprintCell(s)),
  };

  return [
    mechanism,
    stemSim,
    distractor,
    ...fingerprintRows,
    fingerprintGate,
    solver,
    verifier,
    originality,
    approval,
  ];
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

function fingerprintDimensionCell(s: SiblingComparisonInput, dimensionKey: string): ComparisonCell {
  if (!s.verification) return cell(s, "na", "Not verified");
  const row = s.verification.fingerprint_checklist.find((r) => r.dimensionKey === dimensionKey);
  if (!row) return cell(s, "na", "No checklist row");
  return cell(s, verdictToStatus(row.verdict), row.verdict);
}

function verdictToStatus(verdict: FingerprintDimensionVerdict): ComparisonCellStatus {
  if (verdict === "PRESERVED") return "pass";
  if (verdict === "DRIFT") return "fail";
  if (verdict === "UNVERIFIED") return "warn";
  return "na";
}

function fingerprintCell(s: SiblingComparisonInput): ComparisonCell {
  if (!s.verification) return cell(s, "na", "Not verified");
  const gate = s.verification.quality_gate;
  if (gate === "GATE_FAIL") return cell(s, "fail", "GATE_FAIL");
  if (gate === "GATE_CONDITIONAL") return cell(s, "warn", "GATE_CONDITIONAL");
  return cell(s, "pass", gate);
}

function solverCell(s: SiblingComparisonInput): ComparisonCell {
  if (!s.verification) return cell(s, "na", "Not verified");
  const fail = s.verification.findings.find(
    (f) => f.group === "Solver" && f.level === "FAIL",
  );
  if (fail) return cell(s, "fail", fail.code);
  const warn = s.verification.findings.find(
    (f) => f.group === "Solver" && f.level === "WARNING",
  );
  if (warn) return cell(s, "warn", warn.code);
  return cell(s, "pass", "Solver aligned");
}

function verifierCell(s: SiblingComparisonInput): ComparisonCell {
  if (!s.verification) return cell(s, "na", "Not verified");
  return cell(s, fingerprintCell(s).status, s.verification.aggregate_recommendation);
}

function originalityCell(s: SiblingComparisonInput): ComparisonCell {
  if (!s.verification) return cell(s, "na", "Not verified");
  const sim = s.verification.similarity;
  const fail = s.verification.findings.some(
    (f) => f.group === "Similarity" && f.level === "FAIL",
  );
  if (fail) return cell(s, "fail", "Similarity FAIL");
  if (sim?.structural_isomorphism) return cell(s, "fail", "Structural isomorphism");
  if (sim?.wording_overlap_ratio !== undefined && sim.wording_overlap_ratio > 0.55) {
    return cell(s, "warn", `Overlap ${Math.round(sim.wording_overlap_ratio * 100)}%`);
  }
  return cell(s, "pass", "Distinct surface");
}

function approvalCell(s: SiblingComparisonInput): ComparisonCell {
  const status = s.pipelineStatus;
  if (status === "REJECTED") return cell(s, "fail", "REJECTED");
  if (status === "APPROVED") return cell(s, "pass", "APPROVED");
  if (status === "VERIFIED") return cell(s, "pass", "VERIFIED");
  if (status === "SOLVED") return cell(s, "warn", "Awaiting verification");
  return cell(s, "na", status);
}

function cell(
  s: SiblingComparisonInput,
  status: ComparisonCellStatus,
  detail: string,
): ComparisonCell {
  return { candidateId: s.id, siblingIndex: s.siblingIndex, status, detail };
}

export function rowHasMechanismDelta(row: ComparisonRow): boolean {
  if (row.category !== "mechanism") return false;
  const statuses = new Set(row.cells.map((c) => c.status));
  return statuses.size > 1 || row.cells.some((c) => c.status !== "pass");
}

export function rowMatchesVerificationFilter(
  row: ComparisonRow,
  filter: "all" | "fail_warn" | "fingerprint_drift",
): boolean {
  if (filter === "all") return true;
  if (filter === "fail_warn") {
    return row.cells.some((c) => c.status === "fail" || c.status === "warn");
  }
  if (filter === "fingerprint_drift") {
    return row.category === "fingerprint" && row.cells.some((c) => c.status === "fail" || c.status === "warn");
  }
  return true;
}
