# AI Schemas — Question Studio

## Status

**DEFINED (Gate 1 Architect)** — Zod-style specifications for pipeline boundaries. Implementer MUST NOT weaken validation for UI or model convenience. Semantic authority: `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md`, `docs/QUESTION_GENERATION_RULES.md`, `docs/DENEDIO_CONTRACT.md`.

## Global validation policy

| Rule | Detail |
|------|--------|
| **Strict mode** | `.strict()` on objects at API/persistence boundaries unless explicitly documented passthrough. |
| **Reject partial** | Failed parse → stage failure; no silent coercion except documented (e.g. empty URL → null at export only). |
| **Version header** | Every persisted blob includes `schemaVersion: "2026-09-18-gate1"` (bump on breaking change). |
| **Choice invariants** | Shared helper mirrors Denedio: 2–5 choices, labels A–E consecutive from A, exactly one `isCorrect: true`. |
| **UUIDs** | Export/mapping fields use `z.string().uuid()`; trap/archetype ids validated against catalog mirror at dry-run. |

---

## Shared primitives

```typescript
// Conceptual Zod — Implementer colocates in shared/validation/

const schemaVersion = z.literal("2026-09-18-gate1");

const choiceLabel = z.enum(["A", "B", "C", "D", "E"]);

const uuid = z.string().uuid();

const nonEmptyTrimmed = z.string().trim().min(1);

const evidencePointer = z.object({
  sourceBlockId: z.string().optional(),
  page: z.number().int().positive().optional(),
  excerpt: z.string().max(2000),
  charRange: z.tuple([z.number().int(), z.number().int()]).optional(),
});

const bandInt = z.object({
  min: z.number().int(),
  max: z.number().int(),
}).refine((b) => b.min <= b.max);

const verifierFindingLevel = z.enum(["PASS", "WARNING", "FAIL"]);

const fingerprintDimensionVerdict = z.enum([
  "PRESERVED",
  "DRIFT",
  "NOT_APPLICABLE",
  "UNVERIFIED",
]);
```

### Mechanism & trap enums (Gate 1 baseline)

```typescript
const mechanismId = z.enum([
  "MECH_PARTIAL",
  "MECH_REVERSED",
  "MECH_UNIT",
  "MECH_BOUNDARY",
  "MECH_SPECIAL_CASE",
  "MECH_RED_HERRING",
  "MECH_ARITH",
  "MECH_CONCEPT_SWAP",
  "MECH_READ",
  "MECH_VISUAL",
  "MECH_ELIM_FAIL",
]);

const trapTypeId = z.enum([
  "TRAP_PARTIAL",
  "TRAP_UNIT",
  "TRAP_BOUNDARY",
  "TRAP_RED_HERRING",
  "TRAP_CONCEPT_SWAP",
  "TRAP_READ",
  "TRAP_VISUAL",
]);

const operationType = z.enum([
  "parse",
  "model",
  "compute",
  "compare",
  "verify",
  "eliminate",
  "infer",
  "translate",
]);
```

---

## SourceExtractionSchema

**Stage:** 1 (Source analyst). **Maps to:** `SourceQuestion.structured`.

```typescript
const extractionBlock = z.object({
  blockId: z.string(),
  type: z.enum([
    "stem",
    "choice",
    "figure",
    "table",
    "solution",
    "metadata",
    "other",
  ]),
  text: z.string().max(20_000).optional(),
  choiceLabel: choiceLabel.optional(),
  assetRef: z.string().optional(), // storage key or page crop id
  confidence: z.number().min(0).max(1),
  page: z.number().int().positive().optional(),
  bbox: z
    .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
    .optional(),
});

const sourceExtractionChoice = z.object({
  label: choiceLabel,
  text: z.string().max(5000),
  isCorrect: z.boolean().optional(), // if source key visible; else null/absent
  assetRef: z.string().optional(),
});

const SourceExtractionSchema = z
  .object({
    schemaVersion,
    sourceQuestionKey: z.string(), // stable within file, e.g. "p3-q12"
    language: z.string().min(2).max(10).optional(),
    blocks: z.array(extractionBlock).min(1),
    stemText: z.string().min(1).max(20_000),
    choices: z.array(sourceExtractionChoice).min(2).max(5),
    solutionText: z.string().max(20_000).optional(),
    figures: z
      .array(
        z.object({
          figureId: z.string(),
          assetRef: z.string(),
          caption: z.string().max(500).optional(),
        })
      )
      .optional(),
    extractionWarnings: z.array(z.string()).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    // labels consecutive from A, unique
    validateChoiceLabels(val.choices.map((c) => c.label), ctx);
  });
```

---

## PedagogicalFingerprintSchema

**Stage:** 2. **Authority:** full dimensions in pedagogy spec.

```typescript
const solutionSkeletonPhase = z.object({
  phase_id: z.string(),
  operation_type: operationType,
  depends_on: z.array(z.string()).default([]),
  critical_substep: z.boolean(),
  description: z.string().max(500),
});

const distractorMechanismSlot = z.object({
  slot: z.string(), // e.g. wrong choice role "B"
  mechanism_id: mechanismId,
  trap_type_ids: z.array(trapTypeId).min(1),
  misconception_id: nonEmptyTrimmed, // stable slug
  summary: z.string().max(500),
});

const fingerprintDimensionEvidence = z.object({
  dimensionKey: z.string(),
  verdict: fingerprintDimensionVerdict.default("UNVERIFIED"),
  evidence: z.array(evidencePointer).min(0),
  rationale: z.string().max(2000).optional(),
});

const PedagogicalFingerprintSchema = z
  .object({
    schemaVersion,
    fingerprintId: uuid.optional(), // set on persist
    sourceQuestionId: uuid.optional(),
    measured_skill: nonEmptyTrimmed,
    learning_objective: nonEmptyTrimmed,
    cognitive_operation: nonEmptyTrimmed,
    reasoning_pattern: nonEmptyTrimmed,
    solution_skeleton: z.array(solutionSkeletonPhase).min(1),
    critical_signal: z.object({
      role: nonEmptyTrimmed,
      surface_form_notes: z.string().max(1000).optional(),
    }),
    hidden_constraint: nonEmptyTrimmed,
    reasoning_steps: bandInt,
    information_order: nonEmptyTrimmed,
    calculation_burden: z.enum([
      "none",
      "light_mental",
      "multi_step_numeric",
      "symbolic",
      "calculator_expected",
    ]),
    language_burden: z.enum(["low", "medium", "high"]),
    visual_reasoning_burden: z.enum([
      "none",
      "decode_diagram",
      "spatial_transform",
      "graph_read",
      "table_cross_reference",
      "combined",
    ]),
    distractor_mechanisms: z.array(distractorMechanismSlot).min(1),
    misconception_targets: z.array(nonEmptyTrimmed).min(1),
    trap_types: z.array(trapTypeId).min(1),
    elimination_opportunities: z.array(nonEmptyTrimmed),
    difficulty_factors: z.array(
      z.object({
        factor: nonEmptyTrimmed,
        weight: z.enum(["primary", "secondary"]),
      })
    ),
    expected_solve_time_seconds: bandInt,
    question_archetype: z.object({
      archetype_id: nonEmptyTrimmed,
      version: z.string().max(50),
      label: nonEmptyTrimmed,
    }),
    mutable_surface_notes: z.string().max(2000).optional(),
    dimension_evidence: z.array(fingerprintDimensionEvidence).optional(),
  })
  .strict();
```

---

## MutationPlanSchema

**Stage:** 3. **Required** per candidate (`QUESTION_GENERATION_RULES`).

```typescript
const surfaceMutation = z.object({
  dimension: z.enum([
    "context",
    "names",
    "numbers",
    "diagram_class",
    "wording_structure",
    "information_order_presentation",
    "choice_order",
  ]),
  description: nonEmptyTrimmed,
});

const distractorRegenerationEntry = z.object({
  choice_slot: choiceLabel,
  mechanism_id: mechanismId,
  misconception_id: nonEmptyTrimmed,
  parameter_notes: z.string().max(1000),
});

const MutationPlanSchema = z
  .object({
    schemaVersion,
    planId: uuid.optional(),
    fingerprint_ref: uuid, // PedagogicalFingerprintVersion id
    surface_mutations: z.array(surfaceMutation).min(1),
    invariant_assertions: z.array(
      z.object({
        dimension: nonEmptyTrimmed,
        assertion: nonEmptyTrimmed,
      })
    ),
    operand_constraints: z.string().max(2000),
    distractor_regeneration: z.array(distractorRegenerationEntry).min(1),
    anti_copy_notes: nonEmptyTrimmed,
    sibling_group_id: z.string().optional(),
  })
  .strict();
```

---

## GeneratedQuestionSchema

**Stage:** 4–5. Studio internal shape (superset of export content + causality).

```typescript
const generatedChoice = z.object({
  label: choiceLabel,
  text: z.string().max(5000),
  isCorrect: z.boolean(),
  assetRef: z.string().max(500).optional(),
  assetAltText: z.string().max(500).optional(),
  mechanism_id: mechanismId.optional(), // wrong choices required at Stage 5 complete
  trap_type_ids: z.array(trapTypeId).optional(),
  misconception_id: z.string().max(200).optional(),
  error_path_id: z.string().optional(),
});

const GeneratedQuestionSchema = z
  .object({
    schemaVersion,
    studioQuestionId: uuid.optional(),
    stem: z.object({
      questionText: z.string().min(1).max(20_000),
      mediaRefs: z.array(z.string()).optional(),
    }),
    choices: z.array(generatedChoice).min(2).max(5),
    solution: z.object({
      solutionText: z.string().min(1).max(20_000),
      videoSolutionUrl: z.string().url().max(500).or(z.literal("")).optional(),
    }),
    metadata: z
      .object({
        expectedSolveTimeSeconds: z.number().int().min(10).max(3600).optional(),
        criticalClue: z.string().max(2000).optional(),
        idealApproach: z.string().max(5000).optional(),
        commonMistake: z.string().max(2000).optional(),
        strategyExplanation: z.string().max(5000).optional(),
        postExamTip: z.string().max(2000).optional(),
        cognitiveSkill: z.string().max(200).optional(),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(), // export mapping
      })
      .optional(),
    provenance: z.object({
      sourceQuestionId: uuid,
      fingerprintVersionId: uuid,
      generationRunId: uuid,
      mutationPlanId: uuid,
    }),
  })
  .strict()
  .superRefine((val, ctx) => {
    validateChoiceInvariants(val.choices, ctx);
  });
```

---

## DistractorAnalysisSchema

**Stage:** 5.

```typescript
const errorPathStep = z.object({
  order: z.number().int().min(1).max(3),
  student_action: nonEmptyTrimmed,
});

const distractorChoiceAnalysis = z.object({
  choice_label: choiceLabel,
  mechanism_id: mechanismId,
  misconception_id: nonEmptyTrimmed,
  trap_type_ids: z.array(trapTypeId).min(1),
  steps: z.array(errorPathStep).min(1).max(3),
  produces_value: nonEmptyTrimmed,
  validator_note: z.string().max(500).optional(),
});

const DistractorAnalysisSchema = z
  .object({
    schemaVersion,
    candidateId: uuid.optional(),
    wrong_choices: z.array(distractorChoiceAnalysis).min(1),
    all_mechanisms_from_fingerprint: z.boolean(),
    decorative_distractor_flags: z.array(choiceLabel).default([]),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.decorative_distractor_flags.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "REJECT_DISTRACTOR: decorative distractor flagged",
      });
    }
  });
```

---

## SolverResultSchema

**Stage:** 6. **Input isolation:** no fingerprint/plan fields.

```typescript
const SolverResultSchema = z
  .object({
    schemaVersion,
    solverRunId: uuid.optional(),
    selected_label: choiceLabel.nullable(),
    is_unique: z.boolean(),
    ambiguity_reason: z.string().max(1000).optional(),
    reasoning_trace: z.array(
      z.object({
        step: z.number().int().positive(),
        description: z.string().max(2000),
        operation_type: operationType.optional(),
      })
    ),
    matches_expected_correct: z.boolean().optional(), // set by verifier when correct known
    confidence_band: z.enum(["high", "medium", "low"]),
    providerId: z.string(),
    modelId: z.string(),
  })
  .strict();
```

---

## VerificationResultSchema

**Stage:** 7–8. Includes **similarity/originality** and fingerprint fidelity.

```typescript
const verifierFindingCode = z.enum([
  // Trivial / generation rules
  "REJECT_TRIVIAL",
  "REJECT_MECHANISM",
  "REJECT_DISTRACTOR",
  "REJECT_COPY",
  "REJECT_SIBLING",
  // Structural
  "CHOICE_INVARIANT",
  "SOLVER_MISMATCH",
  "SOLVER_AMBIGUOUS",
  "FINGERPRINT_DRIFT",
  "FINGERPRINT_UNVERIFIED",
  "MUTATION_PLAN_MISSING",
  "CAUSALITY_INCOMPLETE",
  // Similarity / originality
  "SIM_STRUCTURAL_ISOMORPHISM",
  "SIM_WORD_OVERLAP",
  "SIM_EMBEDDING_NEAR_DUPLICATE",
  "SIM_SIBLING_COLLAPSE",
  // Export readiness (optional pre-check)
  "EXPORT_FIELD_MISSING",
]);

const verifierFinding = z.object({
  id: z.string(),
  code: verifierFindingCode,
  level: verifierFindingLevel,
  group: z.enum([
    "Solver",
    "Fingerprint",
    "Distractor",
    "Similarity",
    "Schema",
    "Trivial",
  ]),
  message: z.string().max(2000),
  evidence: z.array(evidencePointer).optional(),
  dimensionKey: z.string().optional(),
  fingerprintVerdict: fingerprintDimensionVerdict.optional(),
  remediationScreen: z.enum(["S07", "S11", "S17", "S08"]).optional(),
});

const VerificationResultSchema = z
  .object({
    schemaVersion,
    verifierRunId: uuid.optional(),
    targetType: z.enum(["candidate", "question_version"]),
    targetId: uuid,
    findings: z.array(verifierFinding),
    fingerprint_checklist: z.array(
      z.object({
        dimensionKey: nonEmptyTrimmed,
        verdict: fingerprintDimensionVerdict,
        level: verifierFindingLevel,
        evidence: z.array(evidencePointer).optional(),
      })
    ),
    similarity: z
      .object({
        structural_isomorphism: z.boolean(),
        wording_overlap_ratio: z.number().min(0).max(1).optional(),
        embedding_distance: z.number().optional(),
        source_comparison_ref: uuid.optional(),
        sibling_comparison_refs: z.array(uuid).optional(),
      })
      .optional(),
    aggregate_recommendation: z.enum([
      "APPROVE",
      "REJECT",
      "REVISE_FINGERPRINT",
    ]),
    quality_gate: z.enum(["GATE_PASS", "GATE_CONDITIONAL", "GATE_FAIL"]),
  })
  .strict()
  .superRefine((val, ctx) => {
    const hasFail = val.findings.some((f) => f.level === "FAIL");
    if (hasFail && val.quality_gate === "GATE_PASS") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "quality_gate inconsistent with FAIL findings",
      });
    }
  });
```

### Mapping finding level → UX severity

| `level` | UX (S12, S01) |
|---------|----------------|
| FAIL | P0 Blocker |
| WARNING | P1 Major (ack) |
| PASS | Pass / P2 Minor if informational |

---

## QuestionImportPayloadSchema

**Stage:** 10. **Aligned with Denedio** `importQuestionsSchema` (confirmed contract).

```typescript
const denedioDifficulty = z.enum(["EASY", "MEDIUM", "HARD"]);

const denedioDistractor = z.object({
  trapTypeId: uuid,
  distractorExplanation: z.string().min(1).max(2000).optional(),
  targetMisconception: z.string().min(1).max(1000).optional(),
});

const denedioChoice = z.object({
  label: choiceLabel,
  text: z.string().trim().max(5000),
  isCorrect: z.boolean(),
  assetStorageKey: z.string().trim().min(1).max(500).optional(),
  assetAltText: z.string().trim().max(500).optional(),
  distractor: denedioDistractor.optional(),
});

const denedioQuestionContent = z.object({
  questionText: z.string().min(1).max(20_000),
  solutionText: z.string().min(1).max(20_000),
  choices: z.array(denedioChoice).min(2).max(5),
  videoSolutionUrl: z.string().url().max(500).or(z.literal("")).optional(),
  expectedSolveTimeSeconds: z.number().int().min(10).max(3600).optional(),
  criticalClue: z.string().max(2000).optional(),
  idealApproach: z.string().max(5000).optional(),
  commonMistake: z.string().max(2000).optional(),
  strategyExplanation: z.string().max(5000).optional(),
  postExamTip: z.string().max(2000).optional(),
  cognitiveSkill: z.string().max(200).optional(),
  questionArchetypeId: uuid.optional(),
});

const importQuestionItem = z
  .object({
    examTypeId: uuid,
    examSectionId: uuid,
    subjectId: uuid,
    topicId: uuid,
    unitId: uuid.optional(),
    outcomeId: uuid.optional(),
    difficulty: denedioDifficulty,
    externalKey: z.string().trim().min(1).max(200).optional(),
    content: denedioQuestionContent,
  })
  .strict()
  .superRefine((val, ctx) => {
    validateChoiceInvariants(
      val.content.choices.map((c) => ({
        label: c.label,
        text: c.text,
        isCorrect: c.isCorrect,
        assetStorageKey: c.assetStorageKey,
      })),
      ctx
    );
    // distractor forbidden on correct choice
    val.content.choices.forEach((c, i) => {
      if (c.isCorrect && c.distractor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content", "choices", i, "distractor"],
          message: "distractor on correct choice",
        });
      }
      if (!c.isCorrect && c.distractor && !c.distractor.trapTypeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content", "choices", i, "distractor", "trapTypeId"],
          message: "trapTypeId required when distractor present",
        });
      }
    });
  });

const QuestionImportPayloadSchema = z
  .object({
    schemaVersion,
    items: z.array(importQuestionItem).min(1).max(200),
  })
  .strict()
  .superRefine((val, ctx) => {
    const keys = val.items
      .map((i) => i.externalKey)
      .filter(Boolean) as string[];
    const dup = keys.find((k, idx) => keys.indexOf(k) !== idx);
    if (dup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate externalKey in batch: ${dup}`,
      });
    }
  });
```

### Studio `externalKey` convention

Recommended: `qs:{generatedQuestionId}` — satisfies Denedio idempotency (`importExternalKey` skip on retry). Document on S18 preview banner.

### Mapper from GeneratedQuestionSchema

Implementer service:

- Maps `metadata.difficulty` → item `difficulty`
- Maps curriculum from `DenedioFieldMapping` (UUIDs only)
- Maps wrong-choice causality → `distractor.trapTypeId` (UUID from catalog mirror, not mechanism enum)
- Omits `schemaVersion` from wire payload sent to Denedio (Denedio expects `{ items: [...] }` only — strip wrapper or emit parallel `wirePayload` field)

---

## Similarity & originality (schema usage)

| Signal | Stored in | Finding codes | Default level |
|--------|-----------|---------------|---------------|
| Numeral-stripped skeleton match | `similarity.structural_isomorphism` | `SIM_STRUCTURAL_ISOMORPHISM` | FAIL if true + T1 band easier |
| n-gram overlap vs source | `wording_overlap_ratio` | `SIM_WORD_OVERLAP` | WARNING ≥0.45, FAIL ≥0.65 (tunable Product) |
| Embedding distance vs source | `embedding_distance` | `SIM_EMBEDDING_NEAR_DUPLICATE` | WARNING below threshold |
| Same-run siblings | `sibling_comparison_refs` | `SIM_SIBLING_COLLAPSE`, `REJECT_SIBLING` | FAIL |

**Forbidden:** exposing a single 0–100 “originality score” as approval gate in UI or API.

---

## Helper: validateChoiceInvariants (shared)

Mirror Denedio `validateChoiceInvariants`:

```typescript
function validateChoiceInvariants(
  choices: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
    assetStorageKey?: string;
  }>,
  ctx: z.RefinementCtx
) {
  const labels = ["A", "B", "C", "D", "E"];
  const n = choices.length;
  if (n < 2 || n > 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "choice count 2-5" });
    return;
  }
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    if (choices[i].label !== labels[i]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "labels must be consecutive from A",
      });
      return;
    }
    seen.add(choices[i].label);
  }
  if (seen.size !== n) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "choice labels must be unique",
    });
    return;
  }
  const correctCount = choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "exactly one correct choice",
    });
    return;
  }
  choices.forEach((c, i) => {
    if (!c.text.trim() && !c.assetStorageKey?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content", "choices", i, "text"],
        message: "each choice requires text or assetStorageKey",
      });
    }
  });
}
```

---

## Schema index

| Schema | Pipeline stage | Primary entity |
|--------|----------------|----------------|
| `SourceExtractionSchema` | 1 | SourceQuestion |
| `PedagogicalFingerprintSchema` | 2 | PedagogicalFingerprintVersion |
| `MutationPlanSchema` | 3 | MutationPlan |
| `GeneratedQuestionSchema` | 4–5 | GeneratedQuestionCandidate / QuestionVersion |
| `DistractorAnalysisSchema` | 5 | attached to candidate |
| `SolverResultSchema` | 6 | SolverRun |
| `VerificationResultSchema` | 7–8 | VerifierRun |
| `QuestionImportPayloadSchema` | 10 | ExportAttempt |

---

## References

- `docs/AI_PIPELINE.md`
- `docs/ARCHITECTURE.md`
- `docs/DENEDIO_CONTRACT.md`
- `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md`
- `docs/QUESTION_GENERATION_RULES.md`
