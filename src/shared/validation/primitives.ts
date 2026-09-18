import { z } from "zod";

export const SCHEMA_VERSION = "2026-09-18-gate1" as const;

export const schemaVersion = z.literal(SCHEMA_VERSION);

export const choiceLabel = z.enum(["A", "B", "C", "D", "E"]);

export const uuid = z.string().uuid();

export const nonEmptyTrimmed = z.string().trim().min(1);

export const evidencePointer = z
  .object({
    sourceBlockId: z.string().optional(),
    page: z.number().int().positive().optional(),
    excerpt: z.string().max(2000),
    charRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  })
  .strict();
