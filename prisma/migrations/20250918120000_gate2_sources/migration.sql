-- CreateEnum
CREATE TYPE "ExtractionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SourceExtractionReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FingerprintPipelineState" AS ENUM ('NOT_STARTED', 'DRAFT', 'LOCKED');

-- CreateTable
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "subjectHint" TEXT,
    "languageHint" TEXT,
    "notes" TEXT,
    "fingerprintState" "FingerprintPipelineState" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "status" "ExtractionJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "logs" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB,
    "analystMeta" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "providerId" TEXT,
    "modelId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceQuestion" (
    "id" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "extractionJobId" TEXT NOT NULL,
    "structured" JSONB NOT NULL,
    "reviewStatus" "SourceExtractionReviewStatus" NOT NULL DEFAULT 'PENDING',
    "defectTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceFile_storageKey_key" ON "SourceFile"("storageKey");

-- CreateIndex
CREATE INDEX "SourceFile_missionId_idx" ON "SourceFile"("missionId");

-- CreateIndex
CREATE INDEX "SourceFile_createdAt_idx" ON "SourceFile"("createdAt");

-- CreateIndex
CREATE INDEX "ExtractionJob_sourceFileId_createdAt_idx" ON "ExtractionJob"("sourceFileId", "createdAt");

-- CreateIndex
CREATE INDEX "ExtractionJob_status_idx" ON "ExtractionJob"("status");

-- CreateIndex
CREATE INDEX "SourceQuestion_sourceFileId_idx" ON "SourceQuestion"("sourceFileId");

-- AddForeignKey
ALTER TABLE "SourceFile" ADD CONSTRAINT "SourceFile_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceQuestion" ADD CONSTRAINT "SourceQuestion_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceQuestion" ADD CONSTRAINT "SourceQuestion_extractionJobId_fkey" FOREIGN KEY ("extractionJobId") REFERENCES "ExtractionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
