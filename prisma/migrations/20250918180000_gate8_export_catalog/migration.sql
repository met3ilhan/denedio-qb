-- CreateTable
CREATE TABLE "DenedioFieldMapping" (
    "id" TEXT NOT NULL,
    "generatedQuestionId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "examSectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "unitId" TEXT,
    "outcomeId" TEXT,
    "questionArchetypeId" TEXT,
    "trapTypeMap" JSONB NOT NULL DEFAULT '{}',
    "payloadCache" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DenedioFieldMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportAttempt" (
    "id" TEXT NOT NULL,
    "generatedQuestionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "dryRunResult" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DenedioFieldMapping_generatedQuestionId_key" ON "DenedioFieldMapping"("generatedQuestionId");

-- CreateIndex
CREATE INDEX "ExportAttempt_generatedQuestionId_createdAt_idx" ON "ExportAttempt"("generatedQuestionId", "createdAt");

-- AddForeignKey
ALTER TABLE "DenedioFieldMapping" ADD CONSTRAINT "DenedioFieldMapping_generatedQuestionId_fkey" FOREIGN KEY ("generatedQuestionId") REFERENCES "GeneratedQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportAttempt" ADD CONSTRAINT "ExportAttempt_generatedQuestionId_fkey" FOREIGN KEY ("generatedQuestionId") REFERENCES "GeneratedQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
