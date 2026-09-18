import { NextResponse } from "next/server";

import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ versionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { versionId } = await params;
  const repo = createFingerprintRepository(prisma);
  const result = await repo.lockVersion(versionId);
  return NextResponse.json({
    version: result.version,
    warnings: result.warnings.map((w) => ({ code: w.code, message: w.message })),
  });
}
