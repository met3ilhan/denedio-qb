import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";

const GENERIC_PATTERNS: RegExp[] = [
  /skill derived from source stem/i,
  /learning objective aligned to source stem/i,
  /^recall_and_apply$/i,
  /^stem_guided_reasoning$/i,
  /^source-aligned item$/i,
  /^key cue in the stem$/i,
  /reasoning phase aligned to source stem/i,
  /aligned with source/i,
  /^factor_\d+$/i,
  /^misconception for choice/i,
  /^eliminate options contradicting stem-visible facts$/i,
];

export type FingerprintQualityIssue = {
  field: string;
  reason: string;
};

export function findGenericFingerprintIssues(payload: PedagogicalFingerprint): FingerprintQualityIssue[] {
  const issues: FingerprintQualityIssue[] = [];

  const textFields: Array<[string, string | undefined]> = [
    ["measured_skill", payload.measured_skill],
    ["learning_objective", payload.learning_objective],
    ["cognitive_operation", payload.cognitive_operation],
    ["reasoning_pattern", payload.reasoning_pattern],
    ["hidden_constraint", payload.hidden_constraint],
    ["question_archetype.label", payload.question_archetype?.label],
    ["critical_signal.role", payload.critical_signal?.role],
  ];

  for (const [field, value] of textFields) {
    if (!value?.trim()) {
      issues.push({ field, reason: "empty" });
      continue;
    }
    if (value.trim() === "NOT_ANALYZED") {
      issues.push({ field, reason: "not_analyzed" });
      continue;
    }
    for (const pattern of GENERIC_PATTERNS) {
      if (pattern.test(value)) {
        issues.push({ field, reason: "generic_placeholder" });
        break;
      }
    }
  }

  if (payload.measured_skill.length < 24) {
    issues.push({ field: "measured_skill", reason: "too_short" });
  }
  if (payload.learning_objective.length < 24) {
    issues.push({ field: "learning_objective", reason: "too_short" });
  }

  return issues;
}

export function isAcceptableLiveFingerprint(payload: PedagogicalFingerprint): boolean {
  const issues = findGenericFingerprintIssues(payload);
  const blocking = issues.filter(
    (i) => i.reason === "generic_placeholder" || i.reason === "not_analyzed" || i.reason === "empty",
  );
  return blocking.length === 0;
}
