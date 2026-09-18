CREATE TYPE "CandidatePipelineStatus" AS ENUM ('DRAFT', 'DISTRACTOR_COMPLETE', 'SOLVED', 'VERIFIED', 'APPROVED', 'REJECTED');
CREATE TYPE "GeneratedQuestionStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

ALTER TYPE "GenerationRunStatus" ADD VALUE 'RUNNING';
ALTER TYPE "GenerationRunStatus" ADD VALUE 'SUCCEEDED';
ALTER TYPE "GenerationRunStatus" ADD VALUE 'FAILED';

-- AlterTable GenerationRun
ALTER TABLE "GenerationRun" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "GenerationRun" ADD COLUMN IF NOT EXISTS "modelId" TEXT;
ALTER TABLE "GenerationRun" ADD COLUMN IF NOT EXISTS "stageLog" JSONB NOT NULL DEFAULT '[]';

-- AlterTable MutationPlan
ALTER TABLE "MutationPlan" ADD COLUMN IF NOT EXISTS "siblingIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateTable GeneratedQuestionCandidate
CREATE TABLE "GeneratedQuestionCandidate" (
    "id" TEXT NOT NULL,
    "generationRunId" TEXT NOT NULL,
    "mutationPlanId" TEXT NOT NULL,
    "siblingIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "CandidatePipelineStatus" NOT NULL DEFAULT 'DRAFT',
    "draft" JSONB NOT NULL,
    "distractorAnalysis" JSONB,
    "verificationStaleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedQuestionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable SolverRun
CREATE TABLE "SolverRun" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "independentOfGenerationRunId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolverRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerifierRun
CREATE TABLE "VerifierRun" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifierRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable ApprovalRecord
CREATE TABLE "ApprovalRecord" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "comment" TEXT,
    "decision" TEXT NOT NULL,
    "actorLabel" TEXT NOT NULL DEFAULT 'expert',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable GeneratedQuestion
CREATE TABLE "GeneratedQuestion" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "fingerprintVersionId" TEXT NOT NULL,
    "status" "GeneratedQuestionStatus" NOT NULL DEFAULT 'APPROVED',
    "importExternalKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable QuestionVersion
CREATE TABLE "QuestionVersion" (
    "id" TEXT NOT NULL,
    "generatedQuestionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "createdByLabel" TEXT NOT NULL DEFAULT 'expert',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedQuestionCandidate_generationRunId_idx" ON "GeneratedQuestionCandidate"("generationRunId");
CREATE INDEX "GeneratedQuestionCandidate_status_idx" ON "GeneratedQuestionCandidate"("status");
CREATE INDEX "SolverRun_candidateId_createdAt_idx" ON "SolverRun"("candidateId", "createdAt");
CREATE INDEX "VerifierRun_candidateId_createdAt_idx" ON "VerifierRun"("candidateId", "createdAt");
CREATE INDEX "ApprovalRecord_candidateId_idx" ON "ApprovalRecord"("candidateId");
CREATE INDEX "GeneratedQuestion_status_idx" ON "GeneratedQuestion"("status");
CREATE UNIQUE INDEX "GeneratedQuestion_candidateId_key" ON "GeneratedQuestion"("candidateId");
CREATE UNIQUE INDEX "GeneratedQuestion_importExternalKey_key" ON "GeneratedQuestion"("importExternalKey");
CREATE UNIQUE INDEX "QuestionVersion_generatedQuestionId_versionNumber_key" ON "QuestionVersion"("generatedQuestionId", "versionNumber");

-- AddForeignKey
ALTER TABLE "GeneratedQuestionCandidate" ADD CONSTRAINT "GeneratedQuestionCandidate_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "GenerationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedQuestionCandidate" ADD CONSTRAINT "GeneratedQuestionCandidate_mutationPlanId_fkey" FOREIGN KEY ("mutationPlanId") REFERENCES "MutationPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SolverRun" ADD CONSTRAINT "SolverRun_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "GeneratedQuestionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerifierRun" ADD CONSTRAINT "VerifierRun_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "GeneratedQuestionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "GeneratedQuestionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedQuestion" ADD CONSTRAINT "GeneratedQuestion_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "GeneratedQuestionCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_generatedQuestionId_fkey" FOREIGN KEY ("generatedQuestionId") REFERENCES "GeneratedQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
