import type { Prisma } from "@prisma/client";

import { assessExportEligibility } from "@/modules/export/export-eligibility";
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

export class ExportBlockedError extends Error {
  constructor(
    message: string,
    public readonly reasons: string[],
  ) {
    super(message);
    this.name = "ExportBlockedError";
  }
}

export class ExportRepository {
  constructor(private readonly db: PrismaClient) {}

  async assertExportEligible(generatedQuestionId: string) {
    const question = await this.db.generatedQuestion.findUnique({
      where: { id: generatedQuestionId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        denedioMapping: true,
        candidate: true,
      },
    });
    if (!question || question.versions.length === 0) {
      throw new ExportBlockedError("Question not found or has no versions", ["NOT_FOUND"]);
    }
    const assessment = assessExportEligibility({
      questionStatus: question.status,
      candidateStatus: question.candidate?.status ?? null,
      latestVersionVerificationState: question.versions[0].verificationState,
      hasExplicitDenedioMapping: Boolean(question.denedioMapping),
      verificationStaleAt: question.candidate?.verificationStaleAt ?? null,
    });
    if (!assessment.eligible) {
      throw new ExportBlockedError("Export blocked", assessment.reasons);
    }
    return question;
  }

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
    const question = await this.assertExportEligible(generatedQuestionId).catch((error) => {
      if (error instanceof ExportBlockedError && error.reasons.includes("MISSING_DENEDIO_MAPPING")) {
        return null;
      }
      throw error;
    });
    if (!question) return null;

    const content = generatedQuestionSchema.parse(question.versions[0].content);
    const mappingRow = question.denedioMapping!;
    const curriculum = curriculumFromMapping(parseStoredDenedioFieldMapping(mappingRow));

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
    const question = await this.db.generatedQuestion.findUnique({
      where: { id: generatedQuestionId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        denedioMapping: true,
        candidate: true,
      },
    });
    if (!question || question.versions.length === 0) {
      throw new Error("Question not found or has no versions");
    }

    const assessment = assessExportEligibility({
      questionStatus: question.status,
      candidateStatus: question.candidate?.status ?? null,
      latestVersionVerificationState: question.versions[0].verificationState,
      hasExplicitDenedioMapping: Boolean(question.denedioMapping),
      verificationStaleAt: question.candidate?.verificationStaleAt ?? null,
    });

    if (!assessment.eligible) {
      const issues = assessment.reasons.map((reason) => ({
        level: "error" as const,
        code: dryRunIssueCode(reason),
        message: exportBlockMessage(reason),
        remediationScreen: reason === "MISSING_DENEDIO_MAPPING" ? ("S17" as const) : ("S12" as const),
      }));
      const stub = {
        passed: false,
        issues,
        payloadHash: "",
        wirePayload: { items: [] },
        idempotency: {
          externalKey: question.importExternalKey,
          wouldSkipInDenedio: false,
          note: "Dry-run blocked by export eligibility",
        },
        checksRun: ["export_eligibility"],
        checksDeferredToDenedioPersist: [],
      };
      await this.db.exportAttempt.create({
        data: {
          generatedQuestionId,
          passed: false,
          dryRunResult: stub as Prisma.InputJsonValue,
          payloadHash: `blocked-${assessment.reasons.join("-")}`,
        },
      });
      return stub;
    }

    const payload = await this.buildPayloadForQuestion(generatedQuestionId);
    if (!payload) {
      throw new Error("Payload build failed after eligibility passed");
    }

    const allKeys = await this.db.generatedQuestion.findMany({
      select: { importExternalKey: true },
    });

    const curriculum = question.denedioMapping
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
    await this.assertExportEligible(generatedQuestionId);
    const payload = await this.buildPayloadForQuestion(generatedQuestionId);
    if (!payload) throw new ExportBlockedError("Export blocked", ["MISSING_DENEDIO_MAPPING"]);
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

function dryRunIssueCode(reason: string): string {
  if (reason === "MISSING_DENEDIO_MAPPING") return "MISSING_MAPPING";
  return reason;
}

function exportBlockMessage(reason: string): string {
  switch (reason) {
    case "MISSING_DENEDIO_MAPPING":
      return "Explicit S17 Denedio field mapping required before dry-run";
    case "VERSION_NEEDS_REVERIFY":
      return "Latest question version must be re-verified after expert revision";
    case "VERIFICATION_STALE":
      return "Candidate verification is stale after edits";
    case "CANDIDATE_REJECTED":
      return "Rejected candidates cannot be exported";
    case "NOT_APPROVED":
      return "Only approved question records are exportable";
    default:
      return `Export blocked: ${reason}`;
  }
}
