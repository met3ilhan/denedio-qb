import type { GenerationRunStatus, Prisma, FingerprintVersionStatus } from "@prisma/client";

import type { PrismaClient } from "@/shared/db/client";
import type { MutationPlan } from "@/shared/validation/mutation-plan";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";

export class GenerationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationBlockedError";
  }
}

export class GenerationRepository {
  constructor(private readonly db: PrismaClient) {}

  assertGenerationAllowed(status: FingerprintVersionStatus | undefined) {
    if (status !== "LOCKED") {
      throw new GenerationBlockedError(
        "Generation blocked until fingerprint version is LOCKED",
      );
    }
  }

  async assertFingerprintLockedForGeneration(fingerprintVersionId: string) {
    const version = await this.db.pedagogicalFingerprintVersion.findUnique({
      where: { id: fingerprintVersionId },
    });
    if (!version) {
      throw new GenerationBlockedError("Fingerprint version not found");
    }
    this.assertGenerationAllowed(version.status);
    return version;
  }

  async createSetupRun(missionId: string, fingerprintVersionId: string) {
    await this.assertFingerprintLockedForGeneration(fingerprintVersionId);
    return this.db.generationRun.create({
      data: {
        missionId,
        fingerprintVersionId,
        status: "SETUP",
      },
    });
  }

  async persistMutationPlan(
    generationRunId: string,
    fingerprintVersionId: string,
    payload: MutationPlan,
    siblingIndex = 0,
  ) {
    const parsed = mutationPlanSchema.parse({
      ...payload,
      fingerprint_ref: fingerprintVersionId,
    });
    await this.assertFingerprintLockedForGeneration(fingerprintVersionId);

    return this.db.mutationPlan.create({
      data: {
        generationRunId,
        fingerprintVersionId,
        siblingIndex,
        payload: parsed as Prisma.InputJsonValue,
      },
    });
  }

  async listPlansForRun(generationRunId: string) {
    return this.db.mutationPlan.findMany({ where: { generationRunId } });
  }

  async markRunReady(generationRunId: string, status: GenerationRunStatus = "READY") {
    const run = await this.db.generationRun.findUniqueOrThrow({
      where: { id: generationRunId },
      include: { mutationPlans: true },
    });
    if (run.mutationPlans.length === 0) {
      throw new GenerationBlockedError("Mutation plan required before candidate spawn");
    }
    return this.db.generationRun.update({
      where: { id: generationRunId },
      data: { status },
    });
  }
}

export function createGenerationRepository(db: PrismaClient): GenerationRepository {
  return new GenerationRepository(db);
}
