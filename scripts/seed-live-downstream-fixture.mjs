import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { loadLocalEnv, repoRoot } from "./load-local-env.mjs";

const FIXTURE_IMAGE = "live-smoke-tarih-question.png";

function manifestPath(root) {
  return path.join(root, "e2e", "fixtures", "live-downstream-manifest.json");
}

function payloadsPath(root) {
  return path.join(root, "e2e", "fixtures", "live-downstream-payloads.json");
}

async function putLocalObject(root, storageKey, body, _mimeType) {
  const storageRoot =
    process.env.QUESTION_STUDIO_STORAGE_ROOT ?? path.join(root, ".data", "uploads");
  const target = path.join(storageRoot, storageKey.replace(/\//g, path.sep));
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, body);
  return createHash("sha256").update(body).digest("hex");
}

export async function seedLiveDownstreamFixture(root = repoRoot) {
  loadLocalEnv(root);
  const payloads = JSON.parse(fs.readFileSync(payloadsPath(root), "utf8"));
  const prisma = new PrismaClient();

  try {
    let mission = await prisma.mission.findFirst({
      where: { title: payloads.missionTitle },
    });
    if (!mission) {
      mission = await prisma.mission.create({
        data: { title: payloads.missionTitle },
      });
    }

    const imageBytes = fs.readFileSync(path.join(root, "e2e", "fixtures", FIXTURE_IMAGE));
    const storageKey = `missions/${mission.id}/fixtures/${payloads.originalFilename}`;
    const checksumSha256 = await putLocalObject(root, storageKey, imageBytes, "image/png");

    let source = await prisma.sourceFile.findFirst({
      where: { missionId: mission.id, originalFilename: payloads.originalFilename },
      include: {
        extractionJobs: { orderBy: { createdAt: "desc" }, take: 1 },
        sourceQuestions: { where: { reviewStatus: "ACCEPTED" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!source) {
      source = await prisma.sourceFile.create({
        data: {
          missionId: mission.id,
          originalFilename: payloads.originalFilename,
          storageKey,
          mimeType: "image/png",
          sizeBytes: imageBytes.length,
          checksumSha256,
          subjectHint: payloads.subjectHint,
          languageHint: "tr",
          fingerprintState: "NOT_STARTED",
        },
        include: {
          extractionJobs: true,
          sourceQuestions: true,
        },
      });
    }

    let job = source.extractionJobs?.[0];
    if (!job || job.status !== "SUCCEEDED") {
      if (job) {
        job = await prisma.extractionJob.update({
          where: { id: job.id },
          data: {
            status: "SUCCEEDED",
            attempt: 1,
            result: payloads.extraction,
            analystMeta: {
              providerMode: "LIVE",
              inputBytesSha256: checksumSha256,
              sourceFileId: source.id,
              seededFixture: payloads.fixtureKey,
            },
            providerId: "seed-fixture",
            modelId: "downstream-fixture-v1",
            finishedAt: new Date(),
            logs: [{ at: new Date().toISOString(), level: "info", message: "Seeded extraction (no Gemini)" }],
          },
        });
      } else {
        job = await prisma.extractionJob.create({
          data: {
            sourceFileId: source.id,
            status: "SUCCEEDED",
            attempt: 1,
            result: payloads.extraction,
            analystMeta: {
              providerMode: "LIVE",
              inputBytesSha256: checksumSha256,
              sourceFileId: source.id,
              seededFixture: payloads.fixtureKey,
            },
            providerId: "seed-fixture",
            modelId: "downstream-fixture-v1",
            finishedAt: new Date(),
            logs: [{ at: new Date().toISOString(), level: "info", message: "Seeded extraction (no Gemini)" }],
          },
        });
      }
    }

    let sourceQuestion = source.sourceQuestions?.[0];
    if (!sourceQuestion) {
      sourceQuestion = await prisma.sourceQuestion.create({
        data: {
          sourceFileId: source.id,
          extractionJobId: job.id,
          structured: payloads.extraction,
          reviewStatus: "ACCEPTED",
        },
      });
    }

    let fingerprint = await prisma.pedagogicalFingerprint.findUnique({
      where: { sourceQuestionId: sourceQuestion.id },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    if (!fingerprint) {
      fingerprint = await prisma.pedagogicalFingerprint.create({
        data: { sourceQuestionId: sourceQuestion.id },
        include: { versions: true },
      });
    }

    let version = fingerprint.versions?.[0];
    const fingerprintPayload = {
      ...payloads.fingerprint,
      sourceQuestionId: sourceQuestion.id,
    };

    if (!version) {
      version = await prisma.pedagogicalFingerprintVersion.create({
        data: {
          fingerprintId: fingerprint.id,
          versionNumber: 1,
          status: "LOCKED",
          payload: fingerprintPayload,
          lockedAt: new Date(),
        },
      });
    } else if (version.status !== "LOCKED") {
      version = await prisma.pedagogicalFingerprintVersion.update({
        where: { id: version.id },
        data: {
          status: "LOCKED",
          payload: fingerprintPayload,
          lockedAt: new Date(),
        },
      });
    }

    await prisma.sourceFile.update({
      where: { id: source.id },
      data: { fingerprintState: "LOCKED" },
    });

    const manifest = {
      fixtureKey: payloads.fixtureKey,
      missionId: mission.id,
      sourceFileId: source.id,
      sourceQuestionId: sourceQuestion.id,
      extractionJobId: job.id,
      fingerprintVersionId: version.id,
      checksumSha256,
      seededAt: new Date().toISOString(),
    };

    fs.writeFileSync(manifestPath(root), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    return manifest;
  } finally {
    await prisma.$disconnect();
  }
}

const executedDirectly = process.argv[1]?.includes("seed-live-downstream-fixture.mjs");
if (executedDirectly) {
  seedLiveDownstreamFixture()
    .then((manifest) => {
      console.log("Live downstream fixture seeded:");
      console.log(JSON.stringify(manifest, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
