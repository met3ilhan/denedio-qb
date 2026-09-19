import type { SourceExtraction } from "@/shared/validation/source-extraction";

import { normalizeGeminiExtractionBlocks } from "./normalize-gemini-extraction";

const LABELS = ["A", "B", "C", "D", "E"] as const;

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeChoices(raw: unknown): SourceExtraction["choices"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const row = record(item);
      const label = text(row.label ?? row.choiceLabel ?? row.optionLabel ?? row.letter).toUpperCase();
      const choiceText = text(row.text ?? row.choiceText ?? row.content ?? row.value ?? row.option);
      const normalizedLabel =
        (LABELS.includes(label as (typeof LABELS)[number]) ? label : LABELS[index]) as
          SourceExtraction["choices"][number]["label"];
      if (!choiceText) return null;
      return {
        label: normalizedLabel,
        text: choiceText,
        ...(typeof row.isCorrect === "boolean" ? { isCorrect: row.isCorrect } : {}),
      };
    })
    .filter((choice): choice is SourceExtraction["choices"][number] => choice !== null)
    .slice(0, 5)
    .map((choice, index) => ({ ...choice, label: LABELS[index] }));
}

function normalizeRawBlocks(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    const row = record(entry);
    const rawType = text(row.type ?? row.blockType ?? row.kind).toLowerCase();
    const rawText = text(row.text ?? row.content ?? row.value ?? row.description);
    const rawLabel = text(row.choiceLabel ?? row.label ?? row.optionLabel).toUpperCase();
    return {
      blockId: text(row.blockId ?? row.id ?? row.key) || `block-${index + 1}`,
      type: rawType || (rawLabel ? "choice" : index === 0 ? "stem" : "other"),
      choiceLabel: rawLabel || undefined,
      text: rawText || undefined,
      confidence:
        typeof row.confidence === "number"
          ? row.confidence
          : Number(row.confidence) || 0.8,
      page: row.page ?? row.pageNumber ?? 1,
    };
  });
}

export function normalizeProviderExtraction(
  raw: unknown,
  sourceFileId: string,
  providerName: string,
): {
  extraction: {
    schemaVersion: SourceExtraction["schemaVersion"];
    sourceQuestionKey: string;
    stemText: string;
    choices: SourceExtraction["choices"];
    blocks: SourceExtraction["blocks"];
    language: string;
    solutionText?: string;
    extractionWarnings?: string[];
  };
  rawRecord: Record<string, unknown>;
} {
  const root = record(raw);
  const nested = record(root.extraction ?? root.question ?? root.item);
  let stemText = text(
    nested.stemText ??
      nested.question_stem ??
      nested.questionText ??
      nested.question ??
      nested.prompt ??
      nested.body ??
      nested.content ??
      record(nested.stem).questionText ??
      record(nested.stem).text ??
      root.stemText ??
      root.questionText ??
      root.question_stem ??
      root.prompt ??
      root.content,
  );
  const rawChoices =
    nested.choices ??
    nested.options ??
    nested.answerChoices ??
    nested.answers ??
    root.choices ??
    root.options;
  let choices = normalizeChoices(rawChoices);
  const inferredCorrectLabel = text(
    nested.inferredCorrectLabel ??
      nested.inferred_correct_label ??
      nested.correctAnswerLabel ??
      nested.correct_answer_label ??
      root.inferredCorrectLabel ??
      root.correctAnswerLabel,
  ).toUpperCase();
  if (LABELS.includes(inferredCorrectLabel as (typeof LABELS)[number])) {
    choices = choices.map((choice) => ({
      ...choice,
      isCorrect: choice.label === inferredCorrectLabel,
    }));
  }
  const rawBlocks = nested.blocks ?? nested.contentBlocks ?? root.blocks;
  let blocks = normalizeRawBlocks(rawBlocks);
  if (!stemText) {
    const stemBlock = blocks.find((block) => record(block).type === "stem");
    stemText = stemBlock ? text(record(stemBlock).text) : "";
  }
  if (choices.length === 0 && blocks.length > 0) {
    choices = normalizeChoices(
      blocks
        .filter((block) => record(block).type === "choice")
        .map((block) => ({
          label: record(block).choiceLabel ?? record(block).label,
          text: record(block).text,
        })),
    );
  }
  if (LABELS.includes(inferredCorrectLabel as (typeof LABELS)[number])) {
    choices = choices.map((choice) => ({
      ...choice,
      isCorrect: choice.label === inferredCorrectLabel,
    }));
  }
  if (blocks.length === 0 && stemText && choices.length >= 2) {
    blocks = [
      {
        blockId: `stem-${providerName}`,
        type: "stem",
        text: stemText,
        confidence: 0.85,
        page: 1,
      },
      ...choices.map((choice) => ({
        blockId: `choice-${choice.label.toLowerCase()}`,
        type: "choice",
        choiceLabel: choice.label,
        text: choice.text,
        confidence: 0.85,
        page: 1,
      })),
    ];
  }

  const normalizedBlocks = normalizeGeminiExtractionBlocks(blocks);
  const solutionText = text(
    nested.solutionText ??
      nested.solution ??
      record(nested.explanation).text ??
      root.solutionText,
  );
  const warnings = Array.isArray(nested.extractionWarnings)
    ? nested.extractionWarnings.filter((value): value is string => typeof value === "string")
    : [];
  if (
    LABELS.includes(inferredCorrectLabel as (typeof LABELS)[number]) &&
    !warnings.includes("correct_answer_not_visible_in_source")
  ) {
    warnings.push("correct_answer_not_visible_in_source");
  }

  return {
    extraction: {
      schemaVersion: "2026-09-18-gate1",
      sourceQuestionKey:
        text(nested.sourceQuestionKey ?? root.sourceQuestionKey) ||
        `${providerName}-${sourceFileId.slice(0, 8)}`,
      stemText,
      choices,
      blocks: normalizedBlocks,
      language: text(nested.language ?? root.language) || "tr",
      ...(solutionText ? { solutionText } : {}),
      ...(warnings.length ? { extractionWarnings: warnings } : {}),
    },
    rawRecord: root,
  };
}
