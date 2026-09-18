import type { ExtractionJobStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import {
  mapJobStatusToListState,
  resolveSourceRowHref,
} from "@/modules/sources/domain/source-list";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const extractionState = searchParams.get("extraction") ?? "any";
  const fingerprintState = searchParams.get("fingerprint") ?? "any";

  const repo = createSourceRepository(prisma);
  const rows = await repo.listSourceFiles({
    query,
    extractionState: extractionState as ExtractionJobStatus | "any",
    fingerprintState:
      fingerprintState === "any"
        ? "any"
        : (fingerprintState as "NOT_STARTED" | "DRAFT" | "LOCKED"),
  });

  const items = rows.map((row) => {
    const latestJob = row.extractionJobs[0];
    const extractionListState = mapJobStatusToListState(latestJob?.status);
    const hasAcceptedReview = row.sourceQuestions.some((q) => q.reviewStatus === "ACCEPTED");

    return {
      id: row.id,
      originalFilename: row.originalFilename,
      subjectHint: row.subjectHint,
      languageHint: row.languageHint,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      fingerprintState: row.fingerprintState,
      extractionState: extractionListState,
      extractionJobStatus: latestJob?.status ?? null,
      mission: row.mission,
      createdAt: row.createdAt.toISOString(),
      href: resolveSourceRowHref(row.id, {
        extractionState: extractionListState,
        fingerprintState: row.fingerprintState,
        hasAcceptedReview,
      }),
    };
  });

  return NextResponse.json({ items });
}
