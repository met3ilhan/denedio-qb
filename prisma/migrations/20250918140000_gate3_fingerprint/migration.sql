-- Gate 3 fingerprint + generation setup (P08-P10)

CREATE TYPE "FingerprintVersionStatus" AS ENUM ('DRAFT', 'LOCKED');

CREATE TYPE "GenerationRunStatus" AS ENUM ('SETUP', 'READY', 'CANCELLED');

CREATE TABLE "PedagogicalFingerprint" (
    "id" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedagogicalFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PedagogicalFingerprintVersion" (
    "id" TEXT NOT NULL,
    "fingerprintId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "FingerprintVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedagogicalFingerprintVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FingerprintEvidence" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "dimensionKey" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "pointer" JSONB NOT NULL,
    "excerpt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FingerprintEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GenerationRun" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "fingerprintVersionId" TEXT NOT NULL,
    "status" "GenerationRunStatus" NOT NULL DEFAULT 'SETUP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MutationPlan" (
    "id" TEXT NOT NULL,
    "generationRunId" TEXT NOT NULL,
    "fingerprintVersionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutationPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PedagogicalFingerprint_sourceQuestionId_key" ON "PedagogicalFingerprint"("sourceQuestionId");

CREATE UNIQUE INDEX "PedagogicalFingerprintVersion_fingerprintId_versionNumber_key" ON "PedagogicalFingerprintVersion"("fingerprintId", "versionNumber");

CREATE INDEX "PedagogicalFingerprintVersion_status_idx" ON "PedagogicalFingerprintVersion"("status");

CREATE INDEX "FingerprintEvidence_versionId_idx" ON "FingerprintEvidence"("versionId");

CREATE INDEX "GenerationRun_missionId_idx" ON "GenerationRun"("missionId");

CREATE INDEX "MutationPlan_generationRunId_idx" ON "MutationPlan"("generationRunId");

ALTER TABLE "PedagogicalFingerprint" ADD CONSTRAINT "PedagogicalFingerprint_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "SourceQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PedagogicalFingerprintVersion" ADD CONSTRAINT "PedagogicalFingerprintVersion_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "PedagogicalFingerprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FingerprintEvidence" ADD CONSTRAINT "FingerprintEvidence_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PedagogicalFingerprintVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GenerationRun" ADD CONSTRAINT "GenerationRun_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GenerationRun" ADD CONSTRAINT "GenerationRun_fingerprintVersionId_fkey" FOREIGN KEY ("fingerprintVersionId") REFERENCES "PedagogicalFingerprintVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MutationPlan" ADD CONSTRAINT "MutationPlan_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "GenerationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MutationPlan" ADD CONSTRAINT "MutationPlan_fingerprintVersionId_fkey" FOREIGN KEY ("fingerprintVersionId") REFERENCES "PedagogicalFingerprintVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
