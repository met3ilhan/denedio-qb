import { GOLDEN_GENERATION_FAMILY_FERRY } from "./generation-family-candidates";
import { GOLDEN_MATH_FERRY_CURRENT } from "./math-ferry-current-roundtrip";
import { GOLDEN_MATH_PIECEWISE_KAYAK } from "./math-piecewise-kayak-golden";
import { GOLDEN_SCIENCE_BEAM_MOMENT } from "./science-beam-moment";
import type { GoldenPedagogyRecord } from "./types";
import { GOLDEN_VERBAL_TR_AUTHOR_INFERENCE } from "./verbal-tr-author-inference";

export * from "./types";
export {
  GOLDEN_MATH_FERRY_CURRENT,
  GOLDEN_MATH_PIECEWISE_KAYAK,
  GOLDEN_VERBAL_TR_AUTHOR_INFERENCE,
  GOLDEN_SCIENCE_BEAM_MOMENT,
  GOLDEN_GENERATION_FAMILY_FERRY,
};

/** Expert-approved golden sources for pedagogy / verifier regression. */
export const GOLDEN_PEDAGOGY_SUITE: GoldenPedagogyRecord[] = [
  GOLDEN_MATH_FERRY_CURRENT,
  GOLDEN_MATH_PIECEWISE_KAYAK,
  GOLDEN_VERBAL_TR_AUTHOR_INFERENCE,
  GOLDEN_SCIENCE_BEAM_MOMENT,
];
