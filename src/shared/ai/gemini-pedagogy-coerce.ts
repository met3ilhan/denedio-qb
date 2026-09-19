import {
  MECHANISM_IDS,
  TRAP_TYPE_IDS,
  type MechanismId,
  type TrapTypeId,
} from "@/shared/validation/pedagogy-enums";

const MECH_SET = new Set<string>(MECHANISM_IDS);
const TRAP_SET = new Set<string>(TRAP_TYPE_IDS);

const OPERATION_TYPES = [
  "parse",
  "model",
  "compute",
  "compare",
  "verify",
  "eliminate",
  "infer",
  "translate",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];
const OP_SET = new Set<string>(OPERATION_TYPES);

export function asNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

export function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true" || lower === "yes" || lower === "1") {
      return true;
    }
    if (lower === "false" || lower === "no" || lower === "0") {
      return false;
    }
  }
  return fallback;
}

export function coerceStringArray(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => asNonEmptyString(entry, "")).filter(Boolean);
  }
  if (typeof value === "number") {
    return [];
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;|]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeEnumToken(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

export function coerceMechanismId(raw: unknown, fallback: MechanismId = "MECH_READ"): MechanismId {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return fallback;
  }
  const token = normalizeEnumToken(String(raw));
  if (MECH_SET.has(token)) {
    return token as MechanismId;
  }
  if (token.includes("CONCEPT") || token.includes("SWAP")) {
    return "MECH_CONCEPT_SWAP";
  }
  if (token.includes("READ") || token.includes("COMPREHENSION")) {
    return "MECH_READ";
  }
  if (token.includes("PARTIAL")) {
    return "MECH_PARTIAL";
  }
  if (token.includes("RED") && token.includes("HERRING")) {
    return "MECH_RED_HERRING";
  }
  if (token.includes("VISUAL") || token.includes("DIAGRAM")) {
    return "MECH_VISUAL";
  }
  if (token.includes("ARITH") || token.includes("NUMERIC")) {
    return "MECH_ARITH";
  }
  if (token.includes("ELIM")) {
    return "MECH_ELIM_FAIL";
  }
  return fallback;
}

export function coerceTrapTypeId(raw: unknown, fallback: TrapTypeId = "TRAP_READ"): TrapTypeId {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return fallback;
  }
  const token = normalizeEnumToken(String(raw));
  if (TRAP_SET.has(token)) {
    return token as TrapTypeId;
  }
  if (token.includes("CONCEPT") || token.includes("SWAP")) {
    return "TRAP_CONCEPT_SWAP";
  }
  if (token.includes("READ")) {
    return "TRAP_READ";
  }
  if (token.includes("PARTIAL")) {
    return "TRAP_PARTIAL";
  }
  if (token.includes("RED") && token.includes("HERRING")) {
    return "TRAP_RED_HERRING";
  }
  if (token.includes("VISUAL")) {
    return "TRAP_VISUAL";
  }
  if (token.includes("UNIT")) {
    return "TRAP_UNIT";
  }
  if (token.includes("BOUNDARY")) {
    return "TRAP_BOUNDARY";
  }
  return fallback;
}

export function coerceOperationType(raw: unknown, fallback: OperationType = "parse"): OperationType {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return fallback;
  }
  const lower = String(raw).trim().toLowerCase();
  if (OP_SET.has(lower)) {
    return lower as OperationType;
  }
  if (lower.includes("elimin")) {
    return "eliminate";
  }
  if (lower.includes("compar")) {
    return "compare";
  }
  if (lower.includes("infer") || lower.includes("recall")) {
    return "infer";
  }
  if (lower.includes("verify")) {
    return "verify";
  }
  if (lower.includes("compute") || lower.includes("calc")) {
    return "compute";
  }
  return fallback;
}

export function coerceTrapTypeIdList(raw: unknown, fallback: TrapTypeId = "TRAP_READ"): TrapTypeId[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [fallback];
  }
  const mapped = raw.map((entry) => coerceTrapTypeId(entry, fallback));
  return [...new Set(mapped)];
}

/** Canonical honest text when a dimension does not apply (schema requires non-empty string). */
export const NOT_APPLICABLE_HIDDEN_CONSTRAINT =
  "NOT_APPLICABLE — Stem görünür gerçekleri dışında ek gizli kısıt yok; hatırlama/çıkarım stem üzerinden yapılır.";
