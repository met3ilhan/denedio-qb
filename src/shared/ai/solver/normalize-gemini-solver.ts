import type { SolverResult } from "@/shared/validation/solver-result";
import { solverResultSchema } from "@/shared/validation/solver-result";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

const OPERATION_TYPES = new Set([
  "parse",
  "model",
  "compute",
  "compare",
  "verify",
  "eliminate",
  "infer",
  "translate",
]);

function normalizeOperationType(raw: unknown): SolverResult["reasoning_trace"][number]["operation_type"] {
  if (typeof raw !== "string" || !raw.trim()) {
    return undefined;
  }
  const lower = raw.trim().toLowerCase();
  if (OPERATION_TYPES.has(lower)) {
    return lower as SolverResult["reasoning_trace"][number]["operation_type"];
  }
  if (/read|recall|histor|caus|reason|interpret/.test(lower)) {
    return "infer";
  }
  if (/elimin|reject|exclude/.test(lower)) {
    return "eliminate";
  }
  if (/compar|contrast/.test(lower)) {
    return "compare";
  }
  return "infer";
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

export function normalizeGeminiSolverPayload(
  raw: unknown,
  providerId: string,
  modelId: string,
): SolverResult {
  const rec =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const labelRaw = rec.selected_label ?? rec.selectedLabel;
  const selected_label =
    typeof labelRaw === "string" && labelRaw.trim()
      ? labelRaw.trim().toUpperCase().slice(0, 1)
      : null;

  const confidenceRaw = asString(rec.confidence_band ?? rec.confidenceBand, "medium").toLowerCase();
  const confidence_band =
    confidenceRaw === "high" || confidenceRaw === "low" ? confidenceRaw : ("medium" as const);

  const traceRaw = Array.isArray(rec.reasoning_trace) ? rec.reasoning_trace : rec.reasoningTrace;
  const reasoning_trace = Array.isArray(traceRaw)
    ? traceRaw.map((t, i) => {
        const row =
          typeof t === "object" && t !== null ? (t as Record<string, unknown>) : ({} as Record<string, unknown>);
        return {
          step: typeof row.step === "number" ? row.step : i + 1,
          description: asString(row.description, "Reasoning step"),
          operation_type: normalizeOperationType(row.operation_type ?? row.operationType),
        };
      })
    : [{ step: 1, description: "Independent solution derived from stem and choices only." }];

  return solverResultSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    selected_label,
    is_unique: rec.is_unique === false || rec.isUnique === false ? false : true,
    ambiguity_reason: asString(rec.ambiguity_reason ?? rec.ambiguityReason, "") || undefined,
    reasoning_trace,
    confidence_band,
    providerId,
    modelId,
  });
}
