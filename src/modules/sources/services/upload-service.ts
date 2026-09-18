import { randomUUID } from "node:crypto";

import { createMissionRepository } from "@/modules/missions/repository/mission-repository";
import { tr } from "@/shared/copy/tr";
import type { PrismaClient } from "@/shared/db/client";
import {
  getObjectStorage,
  isAllowedMimeType,
  resolveSourceMimeType,
  validateUploadSize,
} from "@/shared/storage";
import { NoOpVirusScanHook } from "@/shared/storage/virus-scan";

import { createSourceRepository } from "../repository/source-repository";
import { getExtractionWorker } from "./extraction-worker";

export type UploadSourceInput = {
  file: File;
  subjectHint?: string;
  languageHint?: string;
  notes?: string;
  missionTitle?: string;
};

export type UploadSourceResult = {
  missionId: string;
  sourceFileId: string;
  extractionJobId: string;
};

export class UploadService {
  constructor(
    private readonly db: PrismaClient,
    private readonly virusScan = new NoOpVirusScanHook(),
  ) {}

  async uploadIntake(input: UploadSourceInput): Promise<UploadSourceResult> {
    const mimeType = resolveSourceMimeType(input.file.name, input.file.type || "");
    if (!isAllowedMimeType(mimeType)) {
      throw new UploadValidationError("UNSUPPORTED_TYPE", `Unsupported file type: ${mimeType}`);
    }

    const buffer = Buffer.from(await input.file.arrayBuffer());
    const sizeError = validateUploadSize(buffer.length);
    if (sizeError) {
      throw new UploadValidationError("SIZE_LIMIT", sizeError);
    }

    const missionRepo = createMissionRepository(this.db);
    const baseName = input.file.name.replace(/\.[^.]+$/, "");
    const title =
      input.missionTitle?.trim() || tr.mission.defaultTitle(baseName);
    const mission = await missionRepo.createMission({ title });

    const storageKey = `${mission.id}/${randomUUID()}-${sanitizeFilename(input.file.name)}`;
    const storage = getObjectStorage();
    const stored = await storage.putObject(storageKey, buffer, mimeType);

    const scan = await this.virusScan.scan(storageKey, mimeType);
    if (scan.status === "infected") {
      throw new UploadValidationError("VIRUS", scan.detail);
    }

    const sourceRepo = createSourceRepository(this.db);
    const sourceFile = await sourceRepo.createSourceFile({
      mission: { connect: { id: mission.id } },
      originalFilename: input.file.name,
      storageKey,
      mimeType,
      sizeBytes: stored.sizeBytes,
      checksumSha256: stored.checksumSha256,
      subjectHint: input.subjectHint?.trim() || null,
      languageHint: input.languageHint?.trim() || null,
      notes: input.notes?.trim() || null,
    });

    const job = await sourceRepo.createExtractionJob(sourceFile.id);
    await getExtractionWorker(this.db).enqueue(job.id);

    return {
      missionId: mission.id,
      sourceFileId: sourceFile.id,
      extractionJobId: job.id,
    };
  }
}

export class UploadValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
