import { NextResponse } from "next/server";

import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";
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

  const job = source.extractionJobs[0];
  if (!job?.result) {
    return NextResponse.json({ error: "Extraction not ready" }, { status: 404 });
  }

  const extraction = sourceExtractionSchema.parse(job.result);
  const analystMeta = job.analystMeta as Record<string, unknown> | null;

  return NextResponse.json({
    extraction,
    analystMeta,
    jobId: job.id,
    jobStatus: job.status,
    source: {
      id: source.id,
      missionId: source.missionId,
      originalFilename: source.originalFilename,
      mimeType: source.mimeType,
      checksumSha256: source.checksumSha256,
      createdAt: source.createdAt.toISOString(),
      assetUrl: `/api/sources/${source.id}/asset`,
    },
    providerId: job.providerId,
    modelId: job.modelId,
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    action: "accept" | "reject";
    defectTags?: string[];
    extraction?: unknown;
  };

  const repo = createSourceRepository(prisma);
  const job = await repo.getLatestJobForSource(id);
  if (!job || job.status !== "SUCCEEDED" || !job.result) {
    return NextResponse.json({ error: "No successful extraction to review" }, { status: 400 });
  }

  if (body.action === "accept") {
    const extraction = sourceExtractionSchema.parse(body.extraction ?? job.result);
    const record = await repo.acceptExtraction(id, job.id, extraction);
    return NextResponse.json({ sourceQuestion: record });
  }

  if (body.action === "reject") {
    const tags = body.defectTags?.length ? body.defectTags : ["unspecified_defect"];
    const record = await repo.rejectExtraction(id, job.id, tags);
    return NextResponse.json({ sourceQuestion: record });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
