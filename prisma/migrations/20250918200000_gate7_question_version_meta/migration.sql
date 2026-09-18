-- Gate 7: version revision lineage and export verification state
ALTER TABLE "QuestionVersion" ADD COLUMN "parentVersionId" TEXT;
ALTER TABLE "QuestionVersion" ADD COLUMN "revisionReason" TEXT;
ALTER TABLE "QuestionVersion" ADD COLUMN "verificationState" TEXT NOT NULL DEFAULT 'VERIFIED';
ALTER TABLE "QuestionVersion" ADD COLUMN "approvalState" TEXT NOT NULL DEFAULT 'APPROVED';
