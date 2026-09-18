import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";

export type DistractorCausalityState = "SUPPORTED" | "PLAUSIBLE" | "UNVERIFIED" | "CONTRADICTED";

export type DistractorCausalityFinding = {
  choice_label: string;
  state: DistractorCausalityState;
  message: string;
  computed_value?: string;
};

const GENERIC_STEP_RE =
  /^(applies partial|student may calculate|incorrectly|wrong|skip interval|partial sum)/i;

export function verifyDistractorCausality(
  question: GeneratedQuestion,
  distractor: DistractorAnalysis,
): DistractorCausalityFinding[] {
  const findings: DistractorCausalityFinding[] = [];
  const wrong = question.choices.filter((c) => !c.isCorrect);

  const mechanismIds = new Map<string, string[]>();
  for (const entry of distractor.wrong_choices) {
    const list = mechanismIds.get(entry.mechanism_id) ?? [];
    list.push(entry.choice_label);
    mechanismIds.set(entry.mechanism_id, list);
  }
  for (const [mech, labels] of mechanismIds) {
    if (labels.length > 1) {
      for (const label of labels) {
        findings.push({
          choice_label: label,
          state: "CONTRADICTED",
          message: `Duplicate distractor mechanism ${mech} on choices ${labels.join(", ")}`,
        });
      }
    }
  }

  for (const choice of wrong) {
    const entry = distractor.wrong_choices.find((w) => w.choice_label === choice.label);
    if (!entry) continue;

    const produces = normalizeNumericToken(entry.produces_value);
    const choiceNum = normalizeNumericToken(choice.text);
    if (produces && choiceNum && produces !== choiceNum) {
      findings.push({
        choice_label: choice.label,
        state: "CONTRADICTED",
        message: `produces_value (${entry.produces_value}) does not match choice text (${choice.text})`,
        computed_value: produces,
      });
      continue;
    }

    const genericSteps = entry.steps.every(
      (s) => GENERIC_STEP_RE.test(s.student_action.trim()) || s.student_action.trim().length < 12,
    );
    if (genericSteps) {
      findings.push({
        choice_label: choice.label,
        state: "UNVERIFIED",
        message: "Error path is generic — cannot attest causal mechanism",
      });
      continue;
    }

    const replay = tryReplayQuantitativePath(question.stem.questionText, entry);
    if (replay.state === "SUPPORTED") {
      findings.push({
        choice_label: choice.label,
        state: "SUPPORTED",
        message: replay.message,
        computed_value: replay.value,
      });
    } else if (replay.state === "CONTRADICTED") {
      findings.push({
        choice_label: choice.label,
        state: "CONTRADICTED",
        message: replay.message,
        computed_value: replay.value,
      });
    } else {
      findings.push({
        choice_label: choice.label,
        state: "PLAUSIBLE",
        message: "Qualitative mechanism — structured steps present, arithmetic not replayed",
      });
    }
  }

  const quantitativeStem = /km\/h|round trip|hours?\s+cost/i.test(question.stem.questionText);
  if (quantitativeStem && wrong.length >= 2) {
    const supported = findings.filter((f) => f.state === "SUPPORTED").length;
    const contradicted = findings.filter((f) => f.state === "CONTRADICTED").length;
    if (supported === 0 && contradicted === 0) {
      for (const choice of wrong) {
        findings.push({
          choice_label: choice.label,
          state: "UNVERIFIED",
          message: "Quantitative stem but no replayable distractor path (T4 decorative risk)",
        });
      }
    }

    const correct = question.choices.find((c) => c.isCorrect);
    const correctNum = correct ? normalizeNumericToken(correct.text) : null;
    const wrongNums = wrong
      .map((c) => ({ label: c.label, n: normalizeNumericToken(c.text) }))
      .filter((x): x is { label: (typeof wrong)[number]["label"]; n: string } => x.n !== null);

    if (correctNum && wrongNums.length >= 2) {
      const correctValue = Number(correctNum);
      const nearNoise = wrongNums.filter((w) => Math.abs(Number(w.n) - correctValue) <= 2);
      if (nearNoise.length >= 2 && supported === 0) {
        for (const w of nearNoise) {
          findings.push({
            choice_label: w.label,
            state: "CONTRADICTED",
            message:
              "Wrong option within ±2 of correct without replayable mechanism (decorative numeric noise, T4)",
          });
        }
      }
    }
  }

  return findings;
}

function normalizeNumericToken(text: string): string | null {
  const m = text.replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}

function tryReplayQuantitativePath(
  stem: string,
  entry: DistractorAnalysis["wrong_choices"][number],
): { state: DistractorCausalityState; message: string; value?: string } {
  const rates = parseRelativeSpeedRoundTrip(stem);
  if (!rates) {
    return { state: "UNVERIFIED", message: "No quantitative replay model for stem class" };
  }

  const { distanceKm, stillKmh, currentKmh } = rates;
  const target = normalizeNumericToken(entry.produces_value) ?? normalizeNumericToken(entry.steps.join(" "));

  let computed: number | null = null;
  const mech = entry.mechanism_id;

  if (mech === "MECH_CONCEPT_SWAP" && entry.misconception_id.includes("still_water")) {
    computed = ((distanceKm * 2) / stillKmh) * 60;
  } else if (mech === "MECH_READ" || entry.misconception_id.includes("same_ground")) {
    const favorable = stillKmh + currentKmh;
    computed = ((distanceKm / favorable) * 2) * 60;
  } else if (mech === "MECH_SPECIAL_CASE" || entry.misconception_id.includes("unfavorable")) {
    const unfavorable = stillKmh - currentKmh;
    if (unfavorable > 0) computed = ((distanceKm / unfavorable) * 2) * 60;
  }

  if (computed === null) {
    return { state: "UNVERIFIED", message: "Mechanism not mapped to quantitative replay" };
  }

  const rounded = Math.round(computed);
  const value = String(rounded);
  if (target && Math.abs(Number(target) - rounded) > 1) {
    return {
      state: "CONTRADICTED",
      message: `Replayed mistake yields ${rounded} min, not ${target}`,
      value,
    };
  }
  return {
    state: "SUPPORTED",
    message: `Replayed ${mech} yields ${rounded} minutes`,
    value,
  };
}

function parseRelativeSpeedRoundTrip(stem: string): {
  distanceKm: number;
  stillKmh: number;
  currentKmh: number;
} | null {
  const lower = stem.toLowerCase();
  if (!lower.includes("km") && !lower.includes("round")) return null;

  const dist = stem.match(/(\d+(?:\.\d+)?)\s*km/i);
  const still = stem.match(/still(?:\s|-)?water[^0-9]*(\d+(?:\.\d+)?)\s*km\/h/i);
  const current = stem.match(/current[^0-9]*(\d+(?:\.\d+)?)\s*km\/h/i);
  if (!dist || !still || !current) return null;

  return {
    distanceKm: Number(dist[1]),
    stillKmh: Number(still[1]),
    currentKmh: Number(current[1]),
  };
}
