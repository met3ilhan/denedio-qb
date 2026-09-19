import { NextResponse } from "next/server";

import { ensurePedagogicalAnalysisCached } from "@/modules/fingerprints/services/persist-pedagogical-analysis";
import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Fingerprint + classification preview — uses cache unless ?force=1. */
export async function POST(request: Request, { params }: Params) {
  const { id: sourceFileId } = await params;
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  const sources = createSourceRepository(prisma);
  const job = await sources.getLatestJobForSource(sourceFileId);
  if (!job?.result || job.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "Extraction not ready" }, { status: 400 });
  }

  const extraction = sourceExtractionSchema.parse(job.result);
  const bundle = await ensurePedagogicalAnalysisCached(
    prisma,
    job.id,
    extraction,
    sourceFileId,
    { force },
  );

  return NextResponse.json({
    payload: bundle.fingerprint,
    classification: bundle.classification,
    gapWarnings: bundle.gapWarnings,
    qualityWarnings: bundle.qualityWarnings,
    usage: bundle.usage,
    cached: !force,
  });
}
