/** Client-safe Turkish display helpers for pedagogy fields. */

const NOT_APPLICABLE_MARKERS = [
  "NOT_APPLICABLE",
  "NOT_ANALYZED",
  "NOT_APPLICABLE:",
  "NOT_ANALYZED:",
];

export function formatHiddenConstraintDisplay(raw: string | undefined | null): {
  status: string;
  explanation: string;
} {
  const text = raw?.trim() ?? "";
  if (!text) {
    return { status: "Belirlenmedi", explanation: "" };
  }

  const upper = text.toUpperCase();
  if (upper.startsWith("NOT_APPLICABLE")) {
    const explanation = text.replace(/^NOT_APPLICABLE:?\s*/i, "").trim();
    return {
      status: "Uygulanamaz",
      explanation:
        explanation && !/^this is a historical/i.test(explanation)
          ? explanation
          : "Bu soru doğrudan kaynak metnindeki işlev/tanımdan yanıtlanır; ayrı bir gizli koşul taşımaz.",
    };
  }

  if (upper.startsWith("NOT_ANALYZED")) {
    return { status: "Analiz edilemedi", explanation: "" };
  }

  return { status: "Var", explanation: text };
}

export function stripInternalEnumPrefix(value: string): string {
  for (const marker of NOT_APPLICABLE_MARKERS) {
    if (value.toUpperCase().startsWith(marker)) {
      return value.replace(new RegExp(`^${marker}\\s*:?\\s*`, "i"), "").trim();
    }
  }
  return value;
}

export function formatDifficultyTr(difficulty: string | undefined | null): string {
  if (!difficulty) return "Henüz değerlendirilmedi";
  const u = difficulty.toUpperCase();
  if (u === "EASY") return "Kolay";
  if (u === "MEDIUM") return "Orta";
  if (u === "HARD") return "Zor";
  return difficulty;
}

export function formatSolveTimeBandTr(band: { min: number; max: number } | undefined): string {
  if (!band) return "Henüz değerlendirilmedi";
  const mid = Math.round((band.min + band.max) / 2);
  return `${mid} saniye`;
}

export type CorrectAnswerProvenance = "visible_in_source" | "ai_inferred" | "expert_confirmed" | "unset";

export function correctAnswerProvenanceLabel(provenance: CorrectAnswerProvenance): string {
  switch (provenance) {
    case "visible_in_source":
      return "Kaynak görselinde işaretli";
    case "ai_inferred":
      return "AI çözümü · Uzman onayı bekliyor";
    case "expert_confirmed":
      return "Uzman onaylı";
    default:
      return "Belirlenmedi";
  }
}
