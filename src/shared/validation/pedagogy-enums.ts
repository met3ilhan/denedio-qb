import { z } from "zod";

export const mechanismId = z.enum([
  "MECH_PARTIAL",
  "MECH_REVERSED",
  "MECH_UNIT",
  "MECH_BOUNDARY",
  "MECH_SPECIAL_CASE",
  "MECH_RED_HERRING",
  "MECH_ARITH",
  "MECH_CONCEPT_SWAP",
  "MECH_READ",
  "MECH_VISUAL",
  "MECH_ELIM_FAIL",
]);

export const trapTypeId = z.enum([
  "TRAP_PARTIAL",
  "TRAP_UNIT",
  "TRAP_BOUNDARY",
  "TRAP_RED_HERRING",
  "TRAP_CONCEPT_SWAP",
  "TRAP_READ",
  "TRAP_VISUAL",
]);

export const operationType = z.enum([
  "parse",
  "model",
  "compute",
  "compare",
  "verify",
  "eliminate",
  "infer",
  "translate",
]);

export const fingerprintDimensionVerdict = z.enum([
  "PRESERVED",
  "DRIFT",
  "NOT_APPLICABLE",
  "UNVERIFIED",
]);

export type FingerprintDimensionVerdict = z.infer<typeof fingerprintDimensionVerdict>;

export type MechanismId = z.infer<typeof mechanismId>;
export type TrapTypeId = z.infer<typeof trapTypeId>;
