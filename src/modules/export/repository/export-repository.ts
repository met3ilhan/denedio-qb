import type { Prisma } from "@prisma/client";

import { defaultCurriculumSelection } from "@/modules/catalog";
import {
  buildQuestionImportPayload,
  curriculumFromMapping,
} from "@/modules/export/denedio-mapper";
import {
  denedioFieldMappingSchema,
  parseStoredDenedioFieldMapping,
} from "@/modules/export/denedio-field-mapping";
import { hashPayload, runDryRun } from "@/modules/export/dry-run";
import type { PrismaClient } from "@/shared/db/client";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import type { QuestionImportPayload } from "@/shared/validation/question-import-payload";

export class ExportRepository {
  constructor(private readonly db: PrismaClient) {}

  async getMapping(generatedQuestionId: string) {
    return this.db.denedioFieldMapping.findUnique({ where: { generatedQuestionId } });
  }

  async upsertMapping(generatedQuestionId: string, raw: unknown) {
    const mapping = denedioFieldMappingSchema.parse(raw);
    return this.db.denedioFieldMapping.upsert({
      where: { generatedQuestionId },
      create: { generatedQuestionId, ...mapping, trapTypeMap: mapping.trapTypeMap },
      update: { ...mapping, trapTypeMap: mapping.trapTypeMap },
    });
  }

  async buildPayloadForQuestion(generatedQuestionId: string): Promise<QuestionImportPayload | null> {
    const question = await this.db.generatedQuestion.findUnique({
      where: { id: generatedQuestionId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        denedioMapping: true,
      },
    });
    if (!question || question.versions.length === 0) return null;

    const content = generatedQuestionSchema.parse(question.versions[0].content);
    const mappingRow = question.denedioMapping;
    const curriculum = mappingRow
      ? curriculumFromMapping(parseStoredDenedioFieldMapping(mappingRow))
      : defaultCurriculumSelection();

    const trapTypeMap =
      (mappingRow?.trapTypeMap as Record<string, string> | null | undefined) ?? {};

    const payload = buildQuestionImportPayload({
      question: content,
      curriculum,
      importExternalKey: question.importExternalKey,
      trapTypeMap,
      questionArchetypeId: mappingRow?.questionArchetypeId ?? undefined,
    });

    if (mappingRow) {
      await this.db.denedioFieldMapping.update({
        where: { id: mappingRow.id },
        data: { payloadCache: payload as Prisma.InputJsonValue },
      });
    }

    return payload;
  }

  async runDryRunForQuestion(generatedQuestionId: string) {
    const payload = await this.buildPayloadForQuestion(generatedQuestionId);
    if (!payload) {
      throw new Error("Question not found or has no versions");
    }

    const allKeys = await this.db.generatedQuestion.findMany({
      select: { importExternalKey: true },
    });

    const question = await this.db.generatedQuestion.findUnique({
      where: { id: generatedQuestionId },
      include: { denedioMapping: true },
    });

    const curriculum = question?.denedioMapping
      ? curriculumFromMapping(parseStoredDenedioFieldMapping(question.denedioMapping))
      : undefined;

    const result = runDryRun({
      payload,
      curriculum,
      knownImportExternalKeys: allKeys.map((k) => k.importExternalKey),
    });

    await this.db.exportAttempt.create({
      data: {
        generatedQuestionId,
        passed: result.passed,
        dryRunResult: result as Prisma.InputJsonValue,
        payloadHash: result.payloadHash,
      },
    });

    return result;
  }

  async latestDryRun(generatedQuestionId: string) {
    return this.db.exportAttempt.findFirst({
      where: { generatedQuestionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async exportBundle(generatedQuestionId: string) {
    const payload = await this.buildPayloadForQuestion(generatedQuestionId);
    if (!payload) throw new Error("Question not found");
    const latest = await this.latestDryRun(generatedQuestionId);
    if (!latest?.passed) {
      throw new Error("Export blocked until dry-run passes");
    }
    return {
      bundle: {
        generatedAt: new Date().toISOString(),
        generatedQuestionId,
        importExternalKey: payload.items[0]?.externalKey,
        payloadHash: hashPayload(payload),
        dryRunAttemptId: latest.id,
        denedioWire: { items: payload.items },
        publishingEnabled: false,
        note: "Publishing to Denedio is disabled in V1 — download bundle for admin import UI.",
      },
    };
  }
}

export function createExportRepository(db: PrismaClient) {
  return new ExportRepository(db);
}
