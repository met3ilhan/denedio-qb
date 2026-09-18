/** W1 similarity / originality thresholds (env-overridable). */

export type SimilarityThresholds = {
  /** Max allowed wording overlap ratio vs source stem (T2). */
  maxWordingOverlap: number;
  /** Min mutation surface dimensions to avoid T1 structural isomorphism flag. */
  minSurfaceMutationDimensions: number;
  /** Sibling collapse: max plans sharing identical signature in one run (T6). */
  maxSiblingSignatureCollisions: number;
};

const DEFAULTS: SimilarityThresholds = {
  maxWordingOverlap: 0.55,
  minSurfaceMutationDimensions: 2,
  maxSiblingSignatureCollisions: 0,
};

function parseFloatEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw?.trim()) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function getSimilarityThresholds(): SimilarityThresholds {
  return {
    maxWordingOverlap: parseFloatEnv("QUESTION_STUDIO_W1_WORD_OVERLAP_MAX", DEFAULTS.maxWordingOverlap),
    minSurfaceMutationDimensions: parseIntEnv(
      "QUESTION_STUDIO_W1_MIN_SURFACE_DIMENSIONS",
      DEFAULTS.minSurfaceMutationDimensions,
    ),
    maxSiblingSignatureCollisions: parseIntEnv(
      "QUESTION_STUDIO_W1_MAX_SIBLING_COLLISIONS",
      DEFAULTS.maxSiblingSignatureCollisions,
    ),
  };
}

/** Token Jaccard overlap on normalized word sets. */
export function wordingOverlapRatio(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/\d+/g, "#")
      .split(/[^a-z#]+/)
      .filter((t) => t.length > 2),
  );
}

export function stripNumeralsSkeleton(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+([.,]\d+)?/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}
