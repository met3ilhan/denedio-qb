import type { PrismaClient } from "@/shared/db/client";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

import { createSourceRepository } from "../../sources/repository/source-repository";
import {
  inferPedagogicalAnalysis,
  readCachedPedagogicalAnalysis,
  type PedagogicalAnalysisBundle,
} from "./pedagogical-analysis";

export async function ensurePedagogicalAnalysisCached(
  db: PrismaClient,
  jobId: string,
  extraction: SourceExtraction,
  sourceFileId: string,
  options?: { force?: boolean },
): Promise<PedagogicalAnalysisBundle> {
  const repo = createSourceRepository(db);
  const job = await repo.getExtractionJobById(jobId);
  const analystMeta =
    job?.analystMeta && typeof job.analystMeta === "object"
      ? (job.analystMeta as Record<string, unknown>)
      : null;

  if (!options?.force) {
    const cached = readCachedPedagogicalAnalysis(analystMeta, extraction);
    if (cached) {
      return cached;
    }
  }

  const bundle = await inferPedagogicalAnalysis(extraction, `sq-${sourceFileId}`, sourceFileId);
  await repo.mergeJobAnalystMeta(jobId, {
    pedagogicalAnalysis: bundle,
  });
  return bundle;
}
