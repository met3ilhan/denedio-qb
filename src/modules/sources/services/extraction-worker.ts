import { getSourceAnalystProvider } from "@/shared/ai/source-analyst";
import { getObjectStorage } from "@/shared/storage";
import { sourceAnalystEnvelopeSchema } from "@/shared/validation/source-extraction";
import type { PrismaClient } from "@/shared/db/client";

import { appendLogLine } from "../domain/extraction-job-state";
import { createSourceRepository } from "../repository/source-repository";

type WorkerGlobal = typeof globalThis & {
  __qsExtractionWorker?: InProcessExtractionWorker;
};

export class InProcessExtractionWorker {
  private running = false;
  private readonly queue: string[] = [];

  constructor(private readonly db: PrismaClient) {}

  enqueue(jobId: string): void {
    this.queue.push(jobId);
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    while (this.queue.length > 0) {
      const jobId = this.queue.shift()!;
      try {
        await this.processJob(jobId);
      } catch (error) {
        console.error("[extraction-worker] job failed", jobId, error);
      }
    }
    this.running = false;
  }

  async processJob(jobId: string): Promise<void> {
    const repo = createSourceRepository(this.db);
    const job = await repo.getExtractionJobById(jobId);
    if (!job || job.status !== "PENDING") {
      return;
    }

    const source = await repo.getSourceFileById(job.sourceFileId);
    if (!source) {
      return;
    }

    await repo.transitionJob(jobId, "RUNNING", {
      startedAt: new Date(),
    });
    let bootLogs = appendLogLine([], "info", "Worker picked up extraction job");
    bootLogs = appendLogLine(bootLogs, "info", `Attempt ${job.attempt} · file ${source.originalFilename}`);
    await repo.appendJobLogs(jobId, bootLogs);

    try {
      const storage = getObjectStorage();
      const bytes = await storage.getObjectBytes(source.storageKey);
      const provider = getSourceAnalystProvider();

      await repo.appendJobLogs(
        jobId,
        appendLogLine([], "info", `Source analyst: ${provider.providerId}/${provider.modelId}`),
      );

      const envelope = await provider.extract({
        sourceFileId: source.id,
        storageKey: source.storageKey,
        mimeType: source.mimeType,
        originalFilename: source.originalFilename,
        languageHint: source.languageHint,
        subjectHint: source.subjectHint,
        bytes,
      });

      const parsed = sourceAnalystEnvelopeSchema.parse(envelope);

      await repo.transitionJob(jobId, "SUCCEEDED", {
        finishedAt: new Date(),
        result: parsed.extraction,
        analystMeta: {
          blockLayers: parsed.blockLayers,
          layerNotes: parsed.layerNotes,
          demoFixtureId: parsed.demoFixtureId,
          providerMode: parsed.providerMode,
          inputBytesSha256: parsed.inputBytesSha256,
          sourceFileId: source.id,
        },
        providerId: parsed.providerId,
        modelId: parsed.modelId,
      });
      await repo.appendJobLogs(
        jobId,
        appendLogLine([], "info", "Extraction validated against SourceExtractionSchema"),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown extraction error";
      await repo.transitionJob(jobId, "FAILED", {
        finishedAt: new Date(),
        errorCode: "EXTRACTION_FAILED",
        errorMessage: message,
      });
      await repo.appendJobLogs(jobId, appendLogLine([], "error", message));
    }
  }
}

export function getExtractionWorker(db: PrismaClient): InProcessExtractionWorker {
  const g = globalThis as WorkerGlobal;
  if (!g.__qsExtractionWorker) {
    g.__qsExtractionWorker = new InProcessExtractionWorker(db);
  }
  return g.__qsExtractionWorker;
}
