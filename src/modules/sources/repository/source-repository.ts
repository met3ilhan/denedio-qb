import type {
  ExtractionJob,
  ExtractionJobStatus,
  Prisma,
  SourceFile,
  SourceQuestion,
} from "@prisma/client";

import type { PrismaClient } from "@/shared/db/client";
import type { ExtractionLogLine } from "../domain/extraction-job-state";
import { assertExtractionJobTransition } from "../domain/extraction-job-state";

export type SourceFileWithLatestJob = SourceFile & {
  extractionJobs: ExtractionJob[];
  sourceQuestions: SourceQuestion[];
  mission?: { id: string; title: string };
};

export type ListSourcesFilter = {
  extractionState?: ExtractionJobStatus | "any";
  fingerprintState?: SourceFile["fingerprintState"] | "any";
  query?: string;
};

export class SourceRepository {
  constructor(private readonly db: PrismaClient) {}

  async createSourceFile(data: Prisma.SourceFileCreateInput): Promise<SourceFile> {
    return this.db.sourceFile.create({ data });
  }

  async createExtractionJob(sourceFileId: string): Promise<ExtractionJob> {
    const latest = await this.db.extractionJob.findFirst({
      where: { sourceFileId },
      orderBy: { createdAt: "desc" },
    });

    const attempt = latest ? latest.attempt + 1 : 1;

    return this.db.extractionJob.create({
      data: {
        sourceFileId,
        status: "PENDING",
        attempt,
        logs: [],
      },
    });
  }

  async getSourceFileById(id: string): Promise<SourceFileWithLatestJob | null> {
    return this.db.sourceFile.findUnique({
      where: { id },
      include: {
        extractionJobs: { orderBy: { createdAt: "desc" }, take: 5 },
        sourceQuestions: { orderBy: { createdAt: "desc" }, take: 3 },
        mission: true,
      },
    });
  }

  async listSourceFiles(filter: ListSourcesFilter = {}): Promise<SourceFileWithLatestJob[]> {
    const where: Prisma.SourceFileWhereInput = {};

    if (filter.query?.trim()) {
      const q = filter.query.trim();
      where.OR = [
        { originalFilename: { contains: q, mode: "insensitive" } },
        { subjectHint: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filter.fingerprintState && filter.fingerprintState !== "any") {
      where.fingerprintState = filter.fingerprintState;
    }

    const rows = await this.db.sourceFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        extractionJobs: { orderBy: { createdAt: "desc" }, take: 1 },
        sourceQuestions: { where: { reviewStatus: "ACCEPTED" }, take: 1 },
        mission: { select: { id: true, title: true } },
      },
    });

    if (!filter.extractionState || filter.extractionState === "any") {
      return rows;
    }

    return rows.filter((row) => {
      const status = row.extractionJobs[0]?.status;
      return status === filter.extractionState;
    });
  }

  async getExtractionJobById(jobId: string): Promise<ExtractionJob | null> {
    return this.db.extractionJob.findUnique({ where: { id: jobId } });
  }

  async getLatestJobForSource(sourceFileId: string): Promise<ExtractionJob | null> {
    return this.db.extractionJob.findFirst({
      where: { sourceFileId },
      orderBy: { createdAt: "desc" },
    });
  }

  async transitionJob(
    jobId: string,
    to: ExtractionJobStatus,
    patch: Partial<
      Pick<
        ExtractionJob,
        | "logs"
        | "result"
        | "analystMeta"
        | "errorCode"
        | "errorMessage"
        | "providerId"
        | "modelId"
        | "startedAt"
        | "finishedAt"
      >
    > = {},
  ): Promise<ExtractionJob> {
    const job = await this.db.extractionJob.findUniqueOrThrow({ where: { id: jobId } });
    assertExtractionJobTransition(job.status, to);

    const { logs, result, analystMeta, ...rest } = patch;
    return this.db.extractionJob.update({
      where: { id: jobId },
      data: {
        status: to,
        ...rest,
        ...(logs !== undefined ? { logs: logs as Prisma.InputJsonValue } : {}),
        ...(result !== undefined ? { result: result as Prisma.InputJsonValue } : {}),
        ...(analystMeta !== undefined ? { analystMeta: analystMeta as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async appendJobLogs(jobId: string, lines: ExtractionLogLine[]): Promise<ExtractionJob> {
    const job = await this.db.extractionJob.findUniqueOrThrow({ where: { id: jobId } });
    const existing = Array.isArray(job.logs) ? (job.logs as ExtractionLogLine[]) : [];
    return this.db.extractionJob.update({
      where: { id: jobId },
      data: { logs: [...existing, ...lines] as Prisma.InputJsonValue },
    });
  }

  async acceptExtraction(
    sourceFileId: string,
    extractionJobId: string,
    structured: Prisma.InputJsonValue,
  ): Promise<SourceQuestion> {
    return this.db.sourceQuestion.create({
      data: {
        sourceFileId,
        extractionJobId,
        structured,
        reviewStatus: "ACCEPTED",
      },
    });
  }

  async updateSourceReviewMeta(
    sourceFileId: string,
    patch: {
      reviewSubject?: string | null;
      reviewTopic?: string | null;
      reviewSubtopic?: string | null;
      reviewDifficulty?: string | null;
    },
  ): Promise<SourceFile> {
    return this.db.sourceFile.update({
      where: { id: sourceFileId },
      data: patch,
    });
  }

  async updateJobResult(jobId: string, result: Prisma.InputJsonValue): Promise<ExtractionJob> {
    return this.db.extractionJob.update({
      where: { id: jobId },
      data: { result },
    });
  }

  async mergeJobAnalystMeta(
    jobId: string,
    patch: Record<string, unknown>,
  ): Promise<ExtractionJob> {
    const job = await this.db.extractionJob.findUniqueOrThrow({ where: { id: jobId } });
    const existing =
      job.analystMeta && typeof job.analystMeta === "object"
        ? (job.analystMeta as Record<string, unknown>)
        : {};
    return this.db.extractionJob.update({
      where: { id: jobId },
      data: {
        analystMeta: { ...existing, ...patch } as Prisma.InputJsonValue,
      },
    });
  }

  async rejectExtraction(
    sourceFileId: string,
    extractionJobId: string,
    defectTags: string[],
  ): Promise<SourceQuestion> {
    const job = await this.db.extractionJob.findUniqueOrThrow({ where: { id: extractionJobId } });
    return this.db.sourceQuestion.create({
      data: {
        sourceFileId,
        extractionJobId,
        structured: job.result ?? {},
        reviewStatus: "REJECTED",
        defectTags,
      },
    });
  }
}

export function createSourceRepository(db: PrismaClient): SourceRepository {
  return new SourceRepository(db);
}
