import { NextResponse } from "next/server";

import { createFingerprintRepository } from "@/modules/fingerprints";
import { ensureFingerprintDraftForSource } from "@/modules/fingerprints/services/ensure-fingerprint-draft";
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
    return NextResponse.json({ error: "Önce kaynak analizini onaylayın." }, { status: 400 });
  }

  const extraction = sourceExtractionSchema.parse(accepted.structured);
  const existingDraft = await fingerprints.getLatestDraftForSourceFile(sourceFileId);
  const { version, inferred } = await ensureFingerprintDraftForSource(
    fingerprints,
    sourceFileId,
    accepted.id,
    extraction,
  );

  return NextResponse.json({
    version,
    gapWarnings: inferred.gapWarnings,
    reused: Boolean(existingDraft && existingDraft.id === version.id),
  });
}
