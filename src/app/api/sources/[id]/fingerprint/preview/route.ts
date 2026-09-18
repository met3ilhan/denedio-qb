import { NextResponse } from "next/server";

import { inferFingerprintDraftFromExtraction } from "@/modules/fingerprints/services/draft-inference";
import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** In-memory fingerprint preview from latest extraction — no accept required. */
export async function POST(_request: Request, { params }: Params) {
  const { id: sourceFileId } = await params;
  const sources = createSourceRepository(prisma);
  const job = await sources.getLatestJobForSource(sourceFileId);
  if (!job?.result || job.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "Extraction not ready" }, { status: 400 });
  }

  const extraction = sourceExtractionSchema.parse(job.result);
  const inferred = await inferFingerprintDraftFromExtraction(
    extraction,
    `preview-${sourceFileId}`,
    sourceFileId,
  );

  return NextResponse.json({
    payload: inferred.payload,
    gapWarnings: inferred.gapWarnings,
  });
}
