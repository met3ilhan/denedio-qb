import type { ExtractionBlock } from "@/shared/validation/source-extraction";

/** Single uploaded image/PDF page — canonical default across mock + fingerprint evidence. */
export const SINGLE_SOURCE_DEFAULT_PAGE = 1;

const BLOCK_TYPES = new Set<ExtractionBlock["type"]>([
  "stem",
  "choice",
  "figure",
  "table",
  "solution",
  "metadata",
  "other",
]);

const BLOCK_TYPE_ALIASES: Record<string, ExtractionBlock["type"]> = {
  question: "stem",
  soru: "stem",
  option: "choice",
  secenek: "choice",
  seçenek: "choice",
  answer: "solution",
  cozum: "solution",
  çözüm: "solution",
};

function normalizeBlockType(raw: unknown): ExtractionBlock["type"] {
  if (typeof raw !== "string") {
    throw new Error("Gemini block type is not a string");
  }
  const key = raw.trim().toLowerCase();
  if (BLOCK_TYPES.has(key as ExtractionBlock["type"])) {
    return key as ExtractionBlock["type"];
  }
  const aliased = BLOCK_TYPE_ALIASES[key];
  if (aliased) {
    return aliased;
  }
  throw new Error(`Gemini block type "${raw}" is not supported`);
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

/**
 * Normalizes Gemini block `page` quirks before canonical SourceExtractionSchema validation.
 * Gemini often returns `page: null` for one-shot image uploads; domain expects 1 or omitted.
 */
export function normalizeGeminiExtractionBlocks(
  blocks: unknown[],
  defaultPage: number = SINGLE_SOURCE_DEFAULT_PAGE,
): ExtractionBlock[] {
  return blocks.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Gemini block ${index} is not an object`);
    }
    const raw = { ...(entry as Record<string, unknown>) };
    raw.type = normalizeBlockType(raw.type);
    const pageRaw = raw.page;

    if (pageRaw === null || pageRaw === undefined) {
      raw.page = defaultPage;
    } else if (typeof pageRaw === "string") {
      const trimmed = pageRaw.trim();
      if (trimmed === "") {
        raw.page = defaultPage;
      } else {
        const parsed = Number(trimmed);
        if (!isPositiveInt(parsed)) {
          throw new Error(`Gemini block ${index} page is not a positive integer`);
        }
        raw.page = parsed;
      }
    } else if (!isPositiveInt(pageRaw)) {
      throw new Error(`Gemini block ${index} page is not a positive integer`);
    }

    return raw as ExtractionBlock;
  });
}
