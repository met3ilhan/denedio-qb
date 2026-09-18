import type { MutationPlan } from "./mutation-plan";

export type TrivialMutationCode =
  | "T1"
  | "T2"
  | "T3"
  | "T4"
  | "T5"
  | "T6";

export type TrivialMutationFlag = {
  code: TrivialMutationCode;
  message: string;
};

type GuardContext = {
  /** Stem text from structured source (reference). */
  sourceStem?: string;
  /** Other plan payloads in the same run (sibling check). */
  siblingPlans?: MutationPlan[];
};

/**
 * Heuristic preview of QUESTION_GENERATION_RULES T1–T6 — not a substitute for Verifier.
 */
export function previewTrivialMutationFlags(
  plan: MutationPlan,
  context: GuardContext = {},
): TrivialMutationFlag[] {
  const flags: TrivialMutationFlag[] = [];

  const onlyNumbers =
    plan.surface_mutations.length > 0 &&
    plan.surface_mutations.every((m) => m.dimension === "numbers");
  if (onlyNumbers) {
    flags.push({
      code: "T1",
      message:
        "Surface mutations are numbers-only — likely numeric substitution without structural change.",
    });
  }

  if (plan.anti_copy_notes.trim().length < 40) {
    flags.push({
      code: "T2",
      message: "Anti-copy notes are thin — stem may read as a wording clone of the source.",
    });
  }

  const skeletonAssertion = plan.invariant_assertions.find(
    (a) => a.dimension === "solution_skeleton",
  );
  if (!skeletonAssertion || skeletonAssertion.assertion.length < 20) {
    flags.push({
      code: "T3",
      message: "Solution skeleton invariant assertion is missing or weak — mechanism collapse risk.",
    });
  }

  if (plan.distractor_regeneration.some((d) => !d.parameter_notes.trim())) {
    flags.push({
      code: "T4",
      message: "A distractor slot lacks parameter notes — decorative distractor risk.",
    });
  }

  if (!plan.operand_constraints.trim()) {
    flags.push({
      code: "T5",
      message: "Operand constraints empty — difficulty drift vs fingerprint bands.",
    });
  }

  if (context.siblingPlans?.length) {
    const signature = planSignature(plan);
    const dupes = context.siblingPlans.filter((s) => planSignature(s) === signature);
    if (dupes.length > 0) {
      flags.push({
        code: "T6",
        message: "Another plan in this run shares the same mutation signature — near-duplicate sibling.",
      });
    }
  }

  if (
    context.sourceStem &&
    plan.surface_mutations.length === 1 &&
    plan.surface_mutations[0]?.dimension === "numbers" &&
    context.sourceStem.replace(/\d+/g, "#").length < 80
  ) {
    flags.push({
      code: "T1",
      message: "Short stem with numbers-only mutation — skeleton may be isomorphic to source.",
    });
  }

  return flags;
}

function planSignature(plan: MutationPlan): string {
  return [
    plan.surface_mutations.map((m) => m.dimension).sort().join(","),
    plan.distractor_regeneration.map((d) => d.choice_slot).join(","),
  ].join("|");
}
