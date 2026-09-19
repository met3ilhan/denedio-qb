import type { SourceExtraction } from "@/shared/validation/source-extraction";

const LABELS = ["A", "B", "C", "D", "E"] as const;

/** Reconcile choices[] from choice blocks when the model omitted an option (e.g. E). */
export function syncChoicesFromBlocks(
  extraction: Pick<SourceExtraction, "choices" | "blocks">,
): SourceExtraction["choices"] {
  const fromBlocks = extraction.blocks
    .filter((b) => b.type === "choice" && b.choiceLabel)
    .map((b) => ({
      label: b.choiceLabel!,
      text: (b.text ?? "").trim(),
    }))
    .filter((c) => c.text.length > 0);

  const byLabel = new Map(extraction.choices.map((c) => [c.label, c]));
  for (const blockChoice of fromBlocks) {
    if (!byLabel.has(blockChoice.label)) {
      byLabel.set(blockChoice.label, {
        label: blockChoice.label as SourceExtraction["choices"][number]["label"],
        text: blockChoice.text,
        isCorrect: false,
      });
    }
  }

  return LABELS.filter((l) => byLabel.has(l)).map((l) => byLabel.get(l)!);
}
