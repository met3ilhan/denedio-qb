import type {
  FingerprintEvidence,
  FingerprintVersionStatus,
  PedagogicalFingerprintVersion,
  Prisma,
} from "@prisma/client";

import type { PrismaClient } from "@/shared/db/client";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import {
  INVARIANT_FIELD_KEYS,
  pedagogicalFingerprintSchema,
} from "@/shared/validation/pedagogical-fingerprint";
import type { InferredFingerprintDraft } from "../services/draft-inference";

export class FingerprintLockedError extends Error {
  constructor(message = "Fingerprint version is locked and cannot be modified") {
    super(message);
    this.name = "FingerprintLockedError";
  }
}

export class FingerprintEvidenceWarning {
  readonly code = "W3_EVIDENCE_SPARSE" as const;
  constructor(public readonly message: string) {}
}

export type LockFingerprintResult = {
  version: PedagogicalFingerprintVersion;
  warnings: FingerprintEvidenceWarning[];
};

export class FingerprintRepository {
  constructor(private readonly db: PrismaClient) {}

  async getVersionById(versionId: string) {
    return this.db.pedagogicalFingerprintVersion.findUnique({
      where: { id: versionId },
      include: {
        evidence: true,
        fingerprint: { include: { sourceQuestion: { include: { sourceFile: true } } } },
      },
    });
  }

  async getLockedVersionForMission(missionId: string) {
    return this.db.pedagogicalFingerprintVersion.findFirst({
      where: {
        status: "LOCKED",
        fingerprint: {
          sourceQuestion: {
            reviewStatus: "ACCEPTED",
            sourceFile: { missionId },
          },
        },
      },
      orderBy: { lockedAt: "desc" },
      include: { evidence: true },
    });
  }

  async getLatestDraftForSourceFile(sourceFileId: string) {
    return this.db.pedagogicalFingerprintVersion.findFirst({
      where: {
        status: "DRAFT",
        fingerprint: { sourceQuestion: { sourceFileId, reviewStatus: "ACCEPTED" } },
      },
      orderBy: { versionNumber: "desc" },
      include: { evidence: true },
    });
  }

  async getAcceptedSourceQuestionForFile(sourceFileId: string) {
    return this.db.sourceQuestion.findFirst({
      where: { sourceFileId, reviewStatus: "ACCEPTED" },
      orderBy: { createdAt: "desc" },
    });
  }

  async createDraftFromInference(
    sourceQuestionId: string,
    sourceFileId: string,
    draft: InferredFingerprintDraft,
  ) {
    return this.db.$transaction(async (tx) => {
      const fingerprint =
        (await tx.pedagogicalFingerprint.findUnique({ where: { sourceQuestionId } })) ??
        (await tx.pedagogicalFingerprint.create({
          data: { sourceQuestionId },
        }));

      const latest = await tx.pedagogicalFingerprintVersion.findFirst({
        where: { fingerprintId: fingerprint.id },
        orderBy: { versionNumber: "desc" },
      });

      const versionNumber = latest ? latest.versionNumber + 1 : 1;

      const version = await tx.pedagogicalFingerprintVersion.create({
        data: {
          fingerprintId: fingerprint.id,
          versionNumber,
          status: "DRAFT",
          payload: draft.payload as Prisma.InputJsonValue,
        },
      });

      if (draft.evidenceRows.length > 0) {
        await tx.fingerprintEvidence.createMany({
          data: draft.evidenceRows.map((row) => ({
            versionId: version.id,
            dimensionKey: row.dimensionKey,
            evidenceType: row.evidenceType,
            pointer: row.pointer as Prisma.InputJsonValue,
            excerpt: row.excerpt,
          })),
        });
      }

      await tx.sourceFile.update({
        where: { id: sourceFileId },
        data: { fingerprintState: "DRAFT" },
      });

      return tx.pedagogicalFingerprintVersion.findUniqueOrThrow({
        where: { id: version.id },
        include: { evidence: true },
      });
    });
  }

  async replaceDraftFromInference(versionId: string, draft: InferredFingerprintDraft) {
    const version = await this.db.pedagogicalFingerprintVersion.findUniqueOrThrow({
      where: { id: versionId },
    });
    if (version.status === "LOCKED") {
      throw new FingerprintLockedError();
    }
    const parsed = pedagogicalFingerprintSchema.parse(draft.payload);
    return this.db.$transaction(async (tx) => {
      await tx.fingerprintEvidence.deleteMany({ where: { versionId } });
      if (draft.evidenceRows.length > 0) {
        await tx.fingerprintEvidence.createMany({
          data: draft.evidenceRows.map((row) => ({
            versionId,
            dimensionKey: row.dimensionKey,
            evidenceType: row.evidenceType,
            pointer: row.pointer as Prisma.InputJsonValue,
            excerpt: row.excerpt,
          })),
        });
      }
      return tx.pedagogicalFingerprintVersion.update({
        where: { id: versionId },
        data: { payload: parsed as Prisma.InputJsonValue },
        include: { evidence: true },
      });
    });
  }

  async updateDraftPayload(versionId: string, payload: PedagogicalFingerprint) {
    const version = await this.db.pedagogicalFingerprintVersion.findUniqueOrThrow({
      where: { id: versionId },
    });
    if (version.status === "LOCKED") {
      throw new FingerprintLockedError();
    }
    const parsed = pedagogicalFingerprintSchema.parse(payload);
    return this.db.pedagogicalFingerprintVersion.update({
      where: { id: versionId },
      data: { payload: parsed as Prisma.InputJsonValue },
      include: { evidence: true },
    });
  }

  async lockVersion(versionId: string, lockedById?: string): Promise<LockFingerprintResult> {
    const version = await this.db.pedagogicalFingerprintVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: {
        evidence: true,
        fingerprint: { include: { sourceQuestion: true } },
      },
    });

    if (version.status === "LOCKED") {
      return { version, warnings: [] };
    }

    pedagogicalFingerprintSchema.parse(version.payload);

    const warnings: FingerprintEvidenceWarning[] = [];
    if (version.evidence.length === 0) {
      warnings.push(
        new FingerprintEvidenceWarning(
          "No FingerprintEvidence rows — lock allowed but Verifier may treat fidelity as UNVERIFIED (W3).",
        ),
      );
    }

    const locked = await this.db.$transaction(async (tx) => {
      const updated = await tx.pedagogicalFingerprintVersion.update({
        where: { id: versionId },
        data: {
          status: "LOCKED",
          lockedAt: new Date(),
          lockedById: lockedById ?? null,
        },
        include: { evidence: true },
      });

      await tx.sourceFile.update({
        where: { id: version.fingerprint.sourceQuestion.sourceFileId },
        data: { fingerprintState: "LOCKED" },
      });

      return updated;
    });

    return { version: locked, warnings };
  }

  assertMutableField(fieldKey: string) {
    if (INVARIANT_FIELD_KEYS.has(fieldKey)) {
      throw new Error(`Field ${fieldKey} is invariant — unlock workflow required`);
    }
  }
}

export function isFingerprintVersionImmutable(status: FingerprintVersionStatus): boolean {
  return status === "LOCKED";
}

export const EXPERT_DRAFT_EDITABLE_KEYS = new Set([
  "measured_skill",
  "learning_objective",
  "cognitive_operation",
  "reasoning_pattern",
  "hidden_constraint",
  "information_order",
  "mutable_surface_notes",
  "difficulty_factors",
]);

export function mergeMutableFingerprintUpdate(
  current: PedagogicalFingerprint,
  patch: Partial<PedagogicalFingerprint>,
): PedagogicalFingerprint {
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (INVARIANT_FIELD_KEYS.has(key)) {
      throw new Error(`Cannot mutate invariant field ${key} without new version workflow`);
    }
    (next as Record<string, unknown>)[key] = value;
  }
  return pedagogicalFingerprintSchema.parse(next);
}

/** Expert may refine AI draft text fields before lock — not post-lock invariants. */
export function mergeExpertDraftFingerprintUpdate(
  current: PedagogicalFingerprint,
  patch: Partial<PedagogicalFingerprint>,
): PedagogicalFingerprint {
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (!EXPERT_DRAFT_EDITABLE_KEYS.has(key)) {
      throw new Error(`Field ${key} is not expert-editable on draft`);
    }
    (next as Record<string, unknown>)[key] = value;
  }
  return pedagogicalFingerprintSchema.parse(next);
}

export function createFingerprintRepository(db: PrismaClient): FingerprintRepository {
  return new FingerprintRepository(db);
}

export type { FingerprintEvidence, PedagogicalFingerprintVersion };
