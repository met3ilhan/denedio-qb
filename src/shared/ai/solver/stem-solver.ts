import type { SolverInput } from "./types";

export type StemSolveOutcome = {
  selected_label: string | null;
  is_unique: boolean;
  ambiguity_reason?: string;
  confidence_band: "high" | "medium" | "low";
  reasoning_trace: Array<{ step: number; description: string; operation_type?: string }>;
};

/** Deterministic stem-only solver for tests and mock provider — no writer metadata. */
export function solveFromStemOnly(input: SolverInput): StemSolveOutcome {
  const roundTrip = solveRelativeSpeedRoundTrip(input);
  if (roundTrip) return roundTrip;

  const tiered = solveTieredIntervalPricing(input);
  if (tiered) return tiered;

  return {
    selected_label: null,
    is_unique: false,
    ambiguity_reason: "No independent model matched stem class",
    confidence_band: "low",
    reasoning_trace: [
      { step: 1, description: "Parse stem and choices without generation metadata.", operation_type: "parse" },
      { step: 2, description: "No supported quantitative model.", operation_type: "verify" },
    ],
  };
}

function solveRelativeSpeedRoundTrip(input: SolverInput): StemSolveOutcome | null {
  const stem = input.stemText;
  const lower = stem.toLowerCase();
  if (!lower.includes("return") && !lower.includes("round trip")) return null;

  const dist = stem.match(/(\d+(?:\.\d+)?)\s*km/i);
  const still = stem.match(/still(?:\s|-)?water[^0-9]*(\d+(?:\.\d+)?)\s*km\/h/i);
  const current = stem.match(/current[^0-9]*(\d+(?:\.\d+)?)\s*km\/h/i);
  if (!dist || !still || !current) return null;

  const d = Number(dist[1]);
  const s = Number(still[1]);
  const c = Number(current[1]);
  if (s <= c) {
    return {
      selected_label: null,
      is_unique: false,
      ambiguity_reason: "Current speed exceeds still-water speed — return leg undefined in mock model",
      confidence_band: "low",
      reasoning_trace: [
        { step: 1, description: "Parse distance and speeds.", operation_type: "parse" },
        { step: 2, description: "Return leg ground speed non-positive.", operation_type: "verify" },
      ],
    };
  }

  const oneWayOnly =
    lower.includes("one way") ||
    lower.includes("one-way") ||
    (lower.includes("crossing") && !lower.includes("round trip") && !lower.includes("returns"));
  if (oneWayOnly) {
    const favorable = s + c;
    const minutes = Math.round((d / favorable) * 60);
    const label = matchChoiceByNumber(input.choices, minutes);
    return {
      selected_label: label,
      is_unique: Boolean(label),
      confidence_band: label ? "medium" : "low",
      reasoning_trace: [
        { step: 1, description: "Stem requests one-way crossing only.", operation_type: "parse" },
        { step: 2, description: `Use favorable ground speed ${favorable} km/h.`, operation_type: "model" },
        { step: 3, description: `One-way time ≈ ${minutes} minutes.`, operation_type: "compute" },
      ],
    };
  }

  const outHours = d / (s + c);
  const backHours = d / (s - c);
  const totalMinutes = Math.round((outHours + backHours) * 60);

  const matches = input.choices.filter((ch) => {
    const n = normalizeNumber(ch.text);
    return n !== null && Math.abs(n - totalMinutes) <= 1;
  });

  if (matches.length === 0) {
    return {
      selected_label: null,
      is_unique: false,
      ambiguity_reason: `Computed ${totalMinutes} min but no choice within tolerance`,
      confidence_band: "low",
      reasoning_trace: [
        { step: 1, description: "Model outbound and return relative speeds.", operation_type: "model" },
        { step: 2, description: `Round trip total ${totalMinutes} minutes.`, operation_type: "compute" },
        { step: 3, description: "No matching choice label.", operation_type: "verify" },
      ],
    };
  }

  if (matches.length > 1) {
    return {
      selected_label: null,
      is_unique: false,
      ambiguity_reason: "Multiple choices match computed minutes",
      confidence_band: "low",
      reasoning_trace: [
        { step: 1, description: "Round-trip model produced ambiguous choice match.", operation_type: "verify" },
      ],
    };
  }

  return {
    selected_label: matches[0].label,
    is_unique: true,
    confidence_band: "high",
    reasoning_trace: [
      { step: 1, description: "Parse distance, still-water speed, parallel current.", operation_type: "parse" },
      { step: 2, description: `Outbound ${s + c} km/h, return ${s - c} km/h.`, operation_type: "model" },
      { step: 3, description: `Total ${totalMinutes} minutes.`, operation_type: "compute" },
      { step: 4, description: `Select choice ${matches[0].label}.`, operation_type: "verify" },
    ],
  };
}

function solveTieredIntervalPricing(input: SolverInput): StemSolveOutcome | null {
  const stem = input.stemText;
  const hasTieredCue =
    /first\s+\d+\s+hours/i.test(stem) ||
    /first\s+\d+\s+hour/i.test(stem) ||
    /for\s+the\s+first\s+hour/i.test(stem);
  if (!hasTieredCue) return null;

  const classicFirst = stem.match(/first\s+(\d+)\s+hours?\s+cost\s+(\d+)/i);
  const kayakFirst = stem.match(/(\d+)\s+coins?\s+for\s+the\s+first\s+hour/i);
  const additional =
    stem.match(/each\s+additional\s+hour\s+costs?\s+(\d+)/i) ??
    stem.match(/(\d+)\s+coins?\s+for\s+each\s+additional\s+hour/i);
  const totalHours =
    stem.match(/how\s+many\s+(?:credits|units|dollars|coins|\$)?\s*for\s+(\d+)\s+hours?/i) ??
    stem.match(/for\s+(\d+)\s+hours?/i);
  if ((!classicFirst && !kayakFirst) || !additional || !totalHours) return null;

  const firstH = classicFirst ? Number(classicFirst[1]) : 1;
  const baseFee = classicFirst ? Number(classicFirst[2]) : Number(kayakFirst![1]);
  const addFee = Number(additional[1] ?? additional[2]);
  const hours = Number(totalHours[1]);
  const extra = Math.max(0, hours - firstH);
  const total = baseFee + extra * addFee;

  const label = matchChoiceByNumber(input.choices, total);
  return {
    selected_label: label,
    is_unique: Boolean(label),
    confidence_band: label ? "high" : "medium",
    reasoning_trace: [
      { step: 1, description: "Parse tiered interval fees.", operation_type: "parse" },
      { step: 2, description: `Base ${baseFee} + ${extra}×${addFee} = ${total}.`, operation_type: "compute" },
      { step: 3, description: label ? `Select ${label}.` : "No exact choice match.", operation_type: "verify" },
    ],
  };
}

function matchChoiceByNumber(
  choices: SolverInput["choices"],
  target: number,
): string | null {
  for (const ch of choices) {
    const n = normalizeNumber(ch.text);
    if (n !== null && Math.abs(n - target) <= 1) return ch.label;
  }
  return null;
}

function normalizeNumber(text: string): number | null {
  const m = text.replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
