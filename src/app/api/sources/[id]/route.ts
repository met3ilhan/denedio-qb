import { NextResponse } from "next/server";

import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const repo = createSourceRepository(prisma);
  const source = await repo.getSourceFileById(id);
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const latestJob = source.extractionJobs[0] ?? null;

  return NextResponse.json({
    source: {
      id: source.id,
      missionId: source.missionId,
      originalFilename: source.originalFilename,
      mimeType: source.mimeType,
      sizeBytes: source.sizeBytes,
      subjectHint: source.subjectHint,
      languageHint: source.languageHint,
      notes: source.notes,
      fingerprintState: source.fingerprintState,
      createdAt: source.createdAt.toISOString(),
    },
    latestJob,
    mission: source.mission,
  });
}
