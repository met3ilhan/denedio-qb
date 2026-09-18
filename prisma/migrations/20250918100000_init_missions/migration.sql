-- CreateEnum
CREATE TYPE "MissionPhase" AS ENUM ('INTAKE', 'MECHANISM', 'CANDIDATES', 'SHIP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase" "MissionPhase" NOT NULL DEFAULT 'INTAKE',
    "ownerId" TEXT,
    "artifactRefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvenanceEvent" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Mission_phase_idx" ON "Mission"("phase");

-- CreateIndex
CREATE INDEX "Mission_ownerId_idx" ON "Mission"("ownerId");

-- CreateIndex
CREATE INDEX "ProvenanceEvent_missionId_createdAt_idx" ON "ProvenanceEvent"("missionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
