import { NextResponse } from "next/server";

import {
  createFingerprintRepository,
  inferFingerprintDraftFromExtraction,
} from "@/modules/fingerprints";
import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id: sourceFileId } = await params;
  const sources = createSourceRepository(prisma);
  const fingerprints = createFingerprintRepository(prisma);

  const source = await sources.getSourceFileById(sourceFileId);
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accepted = await fingerprints.getAcceptedSourceQuestionForFile(sourceFileId);
  if (!accepted) {
    return NextResponse.json({ error: "Accept structured extraction first (S05)" }, { status: 400 });
  }

  const existingDraft = await fingerprints.getLatestDraftForSourceFile(sourceFileId);
  if (existingDraft) {
    return NextResponse.json({ version: existingDraft, reused: true });
  }

  const extraction = sourceExtractionSchema.parse(accepted.structured);
  const draft = inferFingerprintDraftFromExtraction(extraction, accepted.id);
  const version = await fingerprints.createDraftFromInference(
    accepted.id,
    sourceFileId,
    draft,
  );

  return NextResponse.json({
    version,
    gapWarnings: draft.gapWarnings,
    reused: false,
  });
}
