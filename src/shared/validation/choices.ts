import type { z } from "zod";

const LABELS = ["A", "B", "C", "D", "E"] as const;

export function validateChoiceLabels(labels: string[], ctx: z.RefinementCtx): void {
  const n = labels.length;
  if (n < 2 || n > 5) {
    ctx.addIssue({ code: "custom", message: "choice count 2-5" });
    return;
  }
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    if (labels[i] !== LABELS[i]) {
      ctx.addIssue({
        code: "custom",
        message: "labels must be consecutive from A",
      });
      return;
    }
    seen.add(labels[i]);
  }
  if (seen.size !== n) {
    ctx.addIssue({
      code: "custom",
      message: "choice labels must be unique",
    });
  }
}

export function validateChoiceInvariants(
  choices: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
    assetStorageKey?: string;
  }>,
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[] = ["choices"],
): void {
  const n = choices.length;
  if (n < 2 || n > 5) {
    ctx.addIssue({ code: "custom", message: "choice count 2-5" });
    return;
  }
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    if (choices[i].label !== LABELS[i]) {
      ctx.addIssue({
        code: "custom",
        message: "labels must be consecutive from A",
      });
      return;
    }
    seen.add(choices[i].label);
  }
  if (seen.size !== n) {
    ctx.addIssue({
      code: "custom",
      message: "choice labels must be unique",
    });
    return;
  }
  const correctCount = choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    ctx.addIssue({
      code: "custom",
      message: "exactly one correct choice",
    });
    return;
  }
  choices.forEach((c, i) => {
    if (!c.text.trim() && !c.assetStorageKey?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: [...pathPrefix, i, "text"],
        message: "each choice requires text or assetStorageKey",
      });
    }
  });
}
