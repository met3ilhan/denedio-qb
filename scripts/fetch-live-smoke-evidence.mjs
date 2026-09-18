import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { loadDotenvLocal } from "./load-dotenv-local.mjs";

loadDotenvLocal();
const prisma = new PrismaClient();

const fixture = path.join(process.cwd(), "e2e", "fixtures", "live-smoke-tarih-question.png");
const uploadSha256 = createHash("sha256").update(fs.readFileSync(fixture)).digest("hex");

const job = await prisma.extractionJob.findFirst({
  where: { status: "SUCCEEDED", providerId: "gemini" },
  orderBy: { finishedAt: "desc" },
  include: { sourceFile: true },
});

const sq = job
  ? await prisma.sourceQuestion.findFirst({
      where: { sourceFileId: job.sourceFileId },
      orderBy: { createdAt: "desc" },
    })
  : null;

console.log(
  JSON.stringify(
    {
      sourceFileId: job?.sourceFileId,
      sourceQuestionId: sq?.id ?? null,
      extractionJobId: job?.id,
      uploadSha256,
      storedChecksumSha256: job?.sourceFile?.checksumSha256,
      analystMeta: job?.analystMeta,
      providerId: job?.providerId,
      modelId: job?.modelId,
      stemPreview:
        job?.result && typeof job.result === "object" && "stemText" in job.result
          ? String(job.result.stemText).slice(0, 240)
          : null,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
