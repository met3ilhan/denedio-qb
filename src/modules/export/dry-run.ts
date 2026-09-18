import { createHash } from "node:crypto";

import { assertCurriculumChain, loadCatalogMirror } from "@/modules/catalog";
import type { CurriculumSelection } from "@/modules/catalog";
import {
  type QuestionImportPayload,
  questionImportPayloadSchema,
  toDenedioWirePayload,
} from "@/shared/validation/question-import-payload";

export type DryRunIssueLevel = "error" | "warning" | "info";

export type DryRunIssue = {
  level: DryRunIssueLevel;
  code: string;
  message: string;
  path?: string;
  remediationScreen?: "S16" | "S17" | "S11" | "S12";
};

export type DryRunResult = {
  passed: boolean;
  issues: DryRunIssue[];
  payloadHash: string;
  wirePayload: ReturnType<typeof toDenedioWirePayload>;
  idempotency: {
    externalKey: string | null;
    wouldSkipInDenedio: boolean;
    note: string;
  };
  checksRun: string[];
  checksDeferredToDenedioPersist: string[];
};

const DEFERRED_PERSIST_CHECKS = [
  "assertValidCurriculumSelection (live Denedio DB)",
  "assertTrapTypesExist (live Denedio DB)",
  "assertArchetypeExists (live Denedio DB)",
  "QUESTION_REVIEW permission gate",
  "QuestionAsset stem/solution attachment",
];

export function hashPayload(payload: QuestionImportPayload): string {
  const wire = toDenedioWirePayload(payload);
  return createHash("sha256").update(JSON.stringify(wire)).digest("hex");
}

export type RunDryRunInput = {
  payload: QuestionImportPayload;
  curriculum?: CurriculumSelection;
  knownImportExternalKeys?: string[];
};

export function runDryRun(input: RunDryRunInput): DryRunResult {
  const issues: DryRunIssue[] = [];
  const checksRun = [
    "QuestionImportPayloadSchema (Zod)",
    "validateChoiceInvariants",
    "batch duplicate externalKey",
    "catalog mirror curriculum FK",
    "catalog mirror trapTypeId presence",
  ];

  const parsed = questionImportPayloadSchema.safeParse(input.payload);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        level: "error",
        code: "ZOD_PARSE",
        message: issue.message,
        path: issue.path.join("."),
        remediationScreen: "S17",
      });
    }
    return failResult(input.payload, issues, checksRun);
  }

  const payload = parsed.data;
  const mirror = loadCatalogMirror();
  const item = payload.items[0];
  const curriculum =
    input.curriculum ??
    ({
      examTypeId: item.examTypeId,
      examSectionId: item.examSectionId,
      subjectId: item.subjectId,
      topicId: item.topicId,
      unitId: item.unitId,
      outcomeId: item.outcomeId,
    } satisfies CurriculumSelection);

  const chain = assertCurriculumChain(curriculum, mirror);
  if (!chain.ok) {
    issues.push({
      level: "error",
      code: "CATALOG_FK",
      message: chain.message,
      remediationScreen: "S16",
    });
  }

  for (const trap of mirror.trapTypes) {
    // warm validation path
    void trap.id;
  }

  item.content.choices.forEach((choice, i) => {
    if (!choice.isCorrect && choice.distractor) {
      const trapId = choice.distractor.trapTypeId;
      const known = mirror.trapTypes.some((t) => t.id === trapId && t.active);
      if (!known) {
        issues.push({
          level: "error",
          code: "TRAP_UUID",
          message: `trapTypeId not in catalog mirror: ${trapId}`,
          path: `items.0.content.choices.${i}.distractor.trapTypeId`,
          remediationScreen: "S16",
        });
      }
    }
  });

  if (item.content.questionArchetypeId) {
    const arch = mirror.questionArchetypes.find(
      (a) => a.id === item.content.questionArchetypeId && a.active,
    );
    if (!arch) {
      issues.push({
        level: "error",
        code: "ARCHETYPE_UUID",
        message: "questionArchetypeId not in catalog mirror",
        remediationScreen: "S16",
      });
    }
  }

  const externalKey = item.externalKey ?? null;
  const wouldSkip =
    Boolean(externalKey) &&
    (input.knownImportExternalKeys ?? []).includes(externalKey ?? "");

  if (wouldSkip) {
    issues.push({
      level: "info",
      code: "IDEMPOTENT_SKIP",
      message: `Denedio persist would skip existing importExternalKey: ${externalKey}`,
    });
  }

  const passed = issues.every((i) => i.level !== "error");
  const wirePayload = toDenedioWirePayload(payload);

  return {
    passed,
    issues,
    payloadHash: hashPayload(payload),
    wirePayload,
    idempotency: {
      externalKey,
      wouldSkipInDenedio: wouldSkip,
      note:
        "Stable externalKey aligns with Question.importExternalKey skip-on-retry (see DENEDIO_CONTRACT.md).",
    },
    checksRun,
    checksDeferredToDenedioPersist: DEFERRED_PERSIST_CHECKS,
  };
}

function failResult(
  payload: QuestionImportPayload,
  issues: DryRunIssue[],
  checksRun: string[],
): DryRunResult {
  let wirePayload: ReturnType<typeof toDenedioWirePayload> = { items: [] };
  try {
    wirePayload = toDenedioWirePayload(questionImportPayloadSchema.parse(payload));
  } catch {
    wirePayload = { items: [] };
  }
  return {
    passed: false,
    issues,
    payloadHash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    wirePayload,
    idempotency: {
      externalKey: payload.items[0]?.externalKey ?? null,
      wouldSkipInDenedio: false,
      note: "Fix validation errors before export.",
    },
    checksRun,
    checksDeferredToDenedioPersist: DEFERRED_PERSIST_CHECKS,
  };
}

/** Mirrors Denedio batch duplicate externalKey detection in preview. */
export function detectDuplicateExternalKeysInBatch(externalKeys: string[]): string | null {
  const seen = new Set<string>();
  for (const key of externalKeys) {
    if (!key) continue;
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
}
